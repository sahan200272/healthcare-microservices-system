package com.healthcare.appointment_service.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {

    private String patientId;
    private String doctorId;
    private LocalDateTime appointmentDate;
}