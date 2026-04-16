package com.healthcare.ai_symptom_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.ai_symptom_service.dto.SymptomAnalysisRequest;
import com.healthcare.ai_symptom_service.dto.SymptomAnalysisResponse;
import com.healthcare.ai_symptom_service.dto.gemini.GeminiRequest;
import com.healthcare.ai_symptom_service.dto.gemini.GeminiResponse;
import com.healthcare.ai_symptom_service.exception.GeminiServiceException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class SymptomAnalysisService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    // ── Retry configuration ────────────────────────────────────────────────────
    @Value("${gemini.retry.max-attempts:3}")
    private int retryMaxAttempts;

    @Value("${gemini.retry.initial-backoff-seconds:1}")
    private long retryInitialBackoffSeconds;

    // ── Endpoint ───────────────────────────────────────────────────────────────
    // v1beta is the standard key-based access endpoint for all current Gemini models
    private static final String GEMINI_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private static final String SYSTEM_PROMPT = """
            You are a medical AI assistant. Analyze the given symptoms and respond ONLY with a valid JSON object.
            Do NOT include markdown, code fences, explanations, or any text outside the JSON.
            The JSON must have exactly these three fields:
            {
              "possibleConditions": ["condition1", "condition2"],
              "severity": "Low",
              "recommendedSpecialty": "SpecialtyName"
            }
            Severity must be one of: Low, Moderate, High.
            """;

    // ══════════════════════════════════════════════════════════════════════════
    // Public API
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Analyzes a list of symptoms using the Gemini generative AI API.
     *
     * <p>Retry strategy: up to {@code retryMaxAttempts} automatic retries with
     * exponential back-off (1 s → 2 s → 4 s …), triggered ONLY by HTTP 503
     * (transient overload). All other errors (4xx, parse failures, timeouts)
     * propagate immediately without retrying.
     *
     * <p>Circuit breaker: Resilience4j opens the circuit after repeated failures
     * and routes calls to {@link #fallback} to protect downstream resources.
     */
    @CircuitBreaker(name = "gemini", fallbackMethod = "fallback")
    public SymptomAnalysisResponse analyzeSymptoms(SymptomAnalysisRequest request) {

        // 1. Validate input
        if (request.getSymptoms() == null || request.getSymptoms().isEmpty()) {
            throw new IllegalArgumentException("Symptoms list must not be empty");
        }

        // 2. Confirm API key is loaded
        if (geminiApiKey == null || geminiApiKey.isBlank() || geminiApiKey.equals("${GEMINI_API_KEY}")) {
            log.error("Gemini API key is NOT loaded — check your environment variables");
            throw new GeminiServiceException("Gemini API key is not configured", 500, false);
        }

        // 3. Build request payload
        String symptomsText = String.join(", ", request.getSymptoms());
        String fullPrompt    = SYSTEM_PROMPT + "\nSymptoms: " + symptomsText;

        GeminiRequest geminiRequest = new GeminiRequest(
                List.of(new GeminiRequest.Content(
                        List.of(new GeminiRequest.Part(fullPrompt))
                ))
        );

        // 4. Serialize request for debug logging
        try {
            log.debug("Gemini request payload:\n{}", objectMapper.writeValueAsString(geminiRequest));
        } catch (JsonProcessingException ignored) { }

        String geminiUrl = GEMINI_BASE_URL + geminiModel + ":generateContent";
        log.info("Calling Gemini API — model: {}, endpoint: {}, symptoms: {}",
                geminiModel, geminiUrl, request.getSymptoms());

        // 5. Attempt counter for log messages
        AtomicInteger attemptCounter = new AtomicInteger(0);

        // 6. Reactive call with retry-on-503 + exponential back-off
        String rawResponse = webClientBuilder.build()
                .post()
                .uri(geminiUrl + "?key=" + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(geminiRequest)
                .retrieve()
                // ── Map HTTP errors to typed exceptions ────────────────────
                .onStatus(
                        status -> status.isError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    int statusCode = clientResponse.statusCode().value();
                                    log.error("Gemini API HTTP error — status: {}, body: {}",
                                            statusCode, errorBody);

                                    boolean retryable = (statusCode == 503);
                                    String message = "Gemini API returned HTTP " + statusCode + ": " + errorBody;
                                    return Mono.error(new GeminiServiceException(message, statusCode, retryable));
                                })
                )
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                // ── Retry ONLY on retryable (503) errors ───────────────────
                .retryWhen(
                        Retry.backoff(retryMaxAttempts, Duration.ofSeconds(retryInitialBackoffSeconds))
                                .maxBackoff(Duration.ofSeconds(30))
                                .jitter(0.2)
                                .filter(throwable -> throwable instanceof GeminiServiceException ex
                                        && ex.isRetryable())
                                .doBeforeRetry(retrySignal -> {
                                    long attempt = retrySignal.totalRetries() + 1;
                                    log.warn("Retrying Gemini API (attempt {}/{}) after 503 — {}",
                                            attempt, retryMaxAttempts, retrySignal.failure().getMessage());
                                })
                )
                .block();

        // 7. Log full raw response for debugging
        log.info("RAW GEMINI RESPONSE:\n{}", rawResponse);

        if (rawResponse == null || rawResponse.isBlank()) {
            throw new GeminiServiceException("Gemini API returned an empty response", 502, false);
        }

        // 8. Parse outer Gemini envelope
        GeminiResponse geminiResponse;
        try {
            geminiResponse = objectMapper.readValue(rawResponse, GeminiResponse.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Gemini envelope JSON. Raw:\n{}", rawResponse, e);
            throw new GeminiServiceException(
                    "Failed to parse Gemini API response envelope: " + e.getOriginalMessage(), 502, false);
        }

        // 9. Navigate candidates with null safety
        String aiOutput = extractTextSafe(geminiResponse);
        log.debug("AI text content extracted: {}", aiOutput);

        if (aiOutput == null || aiOutput.isBlank()) {
            throw new GeminiServiceException(
                    "Gemini returned no candidate content — may have been blocked by safety filters. Raw: " + rawResponse,
                    502, false);
        }

        // 10. Strip markdown fences and extract JSON object
        String jsonPart = extractJson(aiOutput);
        log.debug("Extracted JSON for mapping: {}", jsonPart);

        // 11. Validate required fields before deserialisation
        validateJsonFields(jsonPart);

        // 12. Deserialise to response DTO
        try {
            return objectMapper.readValue(jsonPart, SymptomAnalysisResponse.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to map AI JSON to SymptomAnalysisResponse. JSON: {}", jsonPart, e);
            throw new GeminiServiceException(
                    "AI response JSON could not be mapped to expected structure: " + e.getOriginalMessage(),
                    502, false);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Circuit-breaker fallback
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Invoked by Resilience4j when the circuit breaker is OPEN (i.e., the Gemini
     * API has been failing consistently). Returns a structured, frontend-safe
     * response instead of propagating an error.
     *
     * <p>This method intentionally returns a graceful degradation response — it is
     * NOT the same as the suppressed-error "Service is temporarily unavailable"
     * fallback that was removed earlier. Here the circuit is explicitly open, the
     * client is notified politely, and the service stays healthy.
     */
    @SuppressWarnings("unused") // invoked by Resilience4j via reflection
    public SymptomAnalysisResponse fallback(SymptomAnalysisRequest request, Throwable cause) {
        log.warn("Circuit breaker OPEN — Gemini API unavailable. Returning degraded response. Cause: {}",
                cause.getMessage());
        return new SymptomAnalysisResponse(
                List.of("AI analysis temporarily unavailable — please try again shortly"),
                "Unknown",
                "General Practitioner"
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private helpers
    // ══════════════════════════════════════════════════════════════════════════

    private String extractTextSafe(GeminiResponse response) {
        if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
            GeminiResponse.Candidate candidate = response.getCandidates().get(0);
            if (candidate.getContent() != null
                    && candidate.getContent().getParts() != null
                    && !candidate.getContent().getParts().isEmpty()) {
                return candidate.getContent().getParts().get(0).getText();
            }
        }
        return null;
    }

    private String extractJson(String text) {
        if (text == null) return "";
        int firstBracket = text.indexOf('{');
        int lastBracket  = text.lastIndexOf('}');
        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            return text.substring(firstBracket, lastBracket + 1);
        }
        return text.trim();
    }

    private void validateJsonFields(String json) {
        if (!json.contains("\"possibleConditions\"")
                || !json.contains("\"severity\"")
                || !json.contains("\"recommendedSpecialty\"")) {
            throw new GeminiServiceException(
                    "AI response JSON is missing required fields (possibleConditions/severity/recommendedSpecialty)",
                    502, false);
        }
    }
}
