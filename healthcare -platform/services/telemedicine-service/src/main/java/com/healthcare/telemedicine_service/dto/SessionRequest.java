package com.healthcare.telemedicine_service.dto;

import lombok.Data;

@Data
public class SessionRequest {
    private String appointmentId;
    private String patientId;
    private String doctorId;
}
