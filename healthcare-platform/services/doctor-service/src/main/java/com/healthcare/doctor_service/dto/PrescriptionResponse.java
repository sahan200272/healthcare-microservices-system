package com.healthcare.doctor_service.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PrescriptionResponse {

    private String prescriptionId;
    private String doctorId;
    private String doctorName;
    private String patientId;
    private String appointmentId;
    private String diagnosis;
    private List<MedicationResponse> medications;
    private String notes;
    private LocalDateTime issuedAt;

    @Data
    public static class MedicationResponse {
        private String name;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
    }
}
