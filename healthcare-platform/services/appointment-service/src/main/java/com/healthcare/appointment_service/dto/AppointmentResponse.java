package com.healthcare.appointment_service.dto;

import com.healthcare.appointment_service.model.AppointmentStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.time.LocalDate;

@Value
@Builder
public class AppointmentResponse {
    String id;
    String patientId;
    String doctorId;
    LocalDate appointmentDate;
    String timeSlot;
    AppointmentStatus status;
    String reason;
    String consultationType;
    String videoSessionId;
    Instant createdAt;
    Instant updatedAt;
}

