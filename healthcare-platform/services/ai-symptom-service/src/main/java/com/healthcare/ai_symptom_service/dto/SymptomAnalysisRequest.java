package com.healthcare.ai_symptom_service.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SymptomAnalysisRequest {
    @NotEmpty(message = "Symptoms list cannot be empty")
    private List<String> symptoms;
}
