package com.healthcare.ai_symptom_service.exception;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // ── Validation errors (400) ────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }

    // ── Bad request (400) ─────────────────────────────────────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return errorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // ── Typed Gemini failures ─────────────────────────────────────────────────
    /**
     * 4xx from Gemini → 502 Bad Gateway (our config/auth problem)
     * 5xx from Gemini → 503 Service Unavailable (external service down)
     */
    @ExceptionHandler(GeminiServiceException.class)
    public ResponseEntity<Map<String, Object>> handleGeminiServiceException(GeminiServiceException ex) {
        HttpStatus status = (ex.getHttpStatus() >= 500)
                ? HttpStatus.SERVICE_UNAVAILABLE   // 503 — transient external failure
                : HttpStatus.BAD_GATEWAY;          // 502 — config / auth error

        Map<String, Object> body = new HashMap<>();
        body.put("error", "AI service error");
        body.put("detail", ex.getMessage());
        body.put("retryable", ex.isRetryable());
        return ResponseEntity.status(status).body(body);
    }

    // ── Circuit breaker open (503) ─────────────────────────────────────────────
    @ExceptionHandler(CallNotPermittedException.class)
    public ResponseEntity<Map<String, Object>> handleCircuitBreakerOpen(CallNotPermittedException ex) {
        return errorResponse(HttpStatus.SERVICE_UNAVAILABLE,
                "AI service is temporarily unavailable — circuit breaker is open. Please try again later.");
    }

    // ── Raw WebClient errors (should not normally reach here) ─────────────────
    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<Map<String, Object>> handleWebClientResponseException(WebClientResponseException ex) {
        return errorResponse(HttpStatus.BAD_GATEWAY,
                "Upstream AI API error (HTTP " + ex.getStatusCode().value() + "): " + ex.getMessage());
    }

    // ── Generic runtime (500) ─────────────────────────────────────────────────
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    // ── Catch-all (500) ───────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex) {
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred: " + ex.getMessage());
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        body.put("status", status.value());
        return ResponseEntity.status(status).body(body);
    }
}
