package com.healthcare.appointment_service.util;

import com.healthcare.appointment_service.exception.BadRequestException;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;

public record TimeSlot(LocalTime start, LocalTime end) {
    public static TimeSlot parse(String timeSlot) {
        if (timeSlot == null || timeSlot.isBlank()) {
            throw new BadRequestException("timeSlot is required");
        }
        String[] parts = timeSlot.split("-");
        if (parts.length != 2) {
            throw new BadRequestException("timeSlot must be in format HH:mm-HH:mm");
        }
        try {
            LocalTime start = LocalTime.parse(parts[0].trim());
            LocalTime end = LocalTime.parse(parts[1].trim());
            if (!end.isAfter(start)) {
                throw new BadRequestException("timeSlot end time must be after start time");
            }
            return new TimeSlot(start, end);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("timeSlot must be in format HH:mm-HH:mm");
        }
    }
}

