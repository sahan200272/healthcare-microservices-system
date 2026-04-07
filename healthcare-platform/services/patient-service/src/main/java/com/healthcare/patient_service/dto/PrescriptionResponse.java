package com.healthcare.patient_service.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PrescriptionResponse {
    private String prescriptionId;
    private String patientId;
    private String doctorName;
    private String diagnosis;
    private List<String> medicines;
    private String notes;
    private LocalDateTime prescribedAt;
}
