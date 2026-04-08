package com.healthcare.patient_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class PrescriptionRequest {

    @NotBlank(message = "Doctor name is required")
    private String doctorName;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    private List<String> medicines;
    private String notes;
}
