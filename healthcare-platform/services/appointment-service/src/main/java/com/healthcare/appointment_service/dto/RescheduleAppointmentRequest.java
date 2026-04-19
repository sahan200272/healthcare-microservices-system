package com.healthcare.appointment_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RescheduleAppointmentRequest {
    @NotNull
    private LocalDate appointmentDate;

    @Pattern(regexp = "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$", message = "timeSlot must be in format HH:mm-HH:mm")
    private String timeSlot;
}

