package com.healthcare.doctor_service.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AvailabilityRequest {

    @NotNull(message = "Available date is required")
    private LocalDate availableDate;

    @NotEmpty(message = "At least one time slot is required")
    private List<String> timeSlots; // e.g. ["09:00", "09:30", "10:00"]
}
