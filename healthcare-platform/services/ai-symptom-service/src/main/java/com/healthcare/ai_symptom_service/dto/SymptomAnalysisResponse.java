package com.healthcare.ai_symptom_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SymptomAnalysisResponse {
    private List<String> possibleConditions;
    private String severity;
    private String recommendedSpecialty;
}
