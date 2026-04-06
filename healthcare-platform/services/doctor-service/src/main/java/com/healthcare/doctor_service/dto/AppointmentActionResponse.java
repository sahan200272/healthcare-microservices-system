package com.healthcare.doctor_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AppointmentActionResponse {
    private String appointmentId;
    private String status;
    private String message;
}
