package com.healthcare.ai_symptom_service.controller;

import com.healthcare.ai_symptom_service.dto.SymptomAnalysisRequest;
import com.healthcare.ai_symptom_service.dto.SymptomAnalysisResponse;
import com.healthcare.ai_symptom_service.service.SymptomAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/symptoms")
@RequiredArgsConstructor
@Slf4j
public class SymptomController {

    private final SymptomAnalysisService symptomAnalysisService;

    @PostMapping("/analyze")
    public ResponseEntity<SymptomAnalysisResponse> analyzeSymptoms(@Valid @RequestBody SymptomAnalysisRequest request) {
        log.info("Received symptom analysis request: {}", request.getSymptoms());
        // Exceptions from the service propagate to GlobalExceptionHandler → HTTP 500 with detail
        SymptomAnalysisResponse response = symptomAnalysisService.analyzeSymptoms(request);
        log.info("Symptom analysis completed successfully");
        return ResponseEntity.ok(response);
    }
}
