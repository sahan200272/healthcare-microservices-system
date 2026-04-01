package com.healthcare.patient_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "medical_reports")
@Data
public class MedicalReport {

    @Id
    private String reportId;
    
    private String patientId;
    private String reportType;
    private String description;
    private String fileUrl;

    @CreatedDate
    private LocalDateTime uploadedAt;
}
