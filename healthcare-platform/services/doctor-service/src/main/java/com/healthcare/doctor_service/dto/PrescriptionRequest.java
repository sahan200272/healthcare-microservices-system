package com.healthcare.doctor_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class PrescriptionRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Appointment ID is required")
    private String appointmentId;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    @NotEmpty(message = "At least one medication is required")
    private List<MedicationRequest> medications;

    private String notes;

    @Data
    public static class MedicationRequest {

        @NotBlank(message = "Medication name is required")
        private String name;

        @NotBlank(message = "Dosage is required")
        private String dosage;

        @NotBlank(message = "Frequency is required")
        private String frequency;

        @NotBlank(message = "Duration is required")
        private String duration;

        private String instructions;
    }
}
