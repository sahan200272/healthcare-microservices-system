package com.healthcare.doctor_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO representing a medical report returned by the Patient Service.
 * Fields mirror MedicalReport in patient-service.
 *
 * [INTEGRATION POINT] Populated from: GET /api/patients/{patientId}/reports
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MedicalReportResponse {
    private String reportId;
    private String patientId;
    private String reportType;
    private String description;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}
