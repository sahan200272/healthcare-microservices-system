package com.healthcare.patient_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MedicalHistoryRequest {

    @NotBlank(message = "Condition is required")
    private String condition;

    @NotBlank(message = "Diagnosed date is required")
    private String diagnosedDate;

    private String treatment;
    private String notes;
}
