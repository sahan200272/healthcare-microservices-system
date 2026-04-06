package com.healthcare.doctor_service.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AvailabilityResponse {

    private String availabilityId;
    private String doctorId;
    private LocalDate availableDate;
    private List<String> timeSlots;
    private List<String> bookedSlots;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
