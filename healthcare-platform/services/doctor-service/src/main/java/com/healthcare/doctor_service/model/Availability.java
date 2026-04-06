package com.healthcare.doctor_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "availabilities")
@Data
public class Availability {

    @Id
    private String availabilityId;

    private String doctorId;
    private LocalDate availableDate;

    // List of available time slots, e.g. ["09:00", "09:30", "10:00"]
    private List<String> timeSlots;

    // Slots already booked by patients (populated by Appointment Service callbacks)
    private List<String> bookedSlots;

    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
