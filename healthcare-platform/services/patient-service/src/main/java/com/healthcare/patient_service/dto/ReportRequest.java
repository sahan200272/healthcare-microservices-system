package com.healthcare.patient_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReportRequest {

    @NotBlank(message = "Report type is required")
    private String reportType;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "File URL is required")
    private String fileUrl;
}
