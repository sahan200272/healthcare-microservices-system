package com.healthcare.patient_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "medical_history")
@Data
public class MedicalHistory {

    @Id
    private String historyId;

    private String patientId;
    private String condition;       // e.g., "Diabetes", "Hypertension"
    private String diagnosedDate;   // e.g., "2024-01"
    private String treatment;       // e.g., "Insulin therapy"
    private String notes;

    @CreatedDate
    private LocalDateTime recordedAt;
}
