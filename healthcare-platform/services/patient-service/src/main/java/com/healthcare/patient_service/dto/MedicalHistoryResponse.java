package com.healthcare.patient_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MedicalHistoryResponse {
    private String historyId;
    private String patientId;
    private String condition;
    private String diagnosedDate;
    private String treatment;
    private String notes;
    private LocalDateTime recordedAt;
}
