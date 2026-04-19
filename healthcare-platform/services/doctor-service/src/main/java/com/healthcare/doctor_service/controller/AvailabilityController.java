package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.AvailabilityRequest;
import com.healthcare.doctor_service.dto.AvailabilityResponse;
import com.healthcare.doctor_service.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors/{doctorId}/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    /**
     * POST /api/doctors/{doctorId}/availability
     * Doctor sets their availability for a specific date.
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AvailabilityResponse> addAvailability(
            @PathVariable String doctorId,
            @Valid @RequestBody AvailabilityRequest request) {
        AvailabilityResponse response = availabilityService.addAvailability(doctorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/doctors/{doctorId}/availability
     * Retrieve all upcoming availability slots for a doctor.
     * Open to all authenticated users (patients browse before booking).
     */
    @GetMapping
    public ResponseEntity<List<AvailabilityResponse>> getAvailability(@PathVariable String doctorId) {
        return ResponseEntity.ok(availabilityService.getUpcomingAvailability(doctorId));
    }

    /**
     * GET /api/doctors/{doctorId}/availability/check?date=YYYY-MM-DD&timeSlot=HH:mm
     *
     * Called by the Appointment Service to verify a slot is available before booking.
     * Returns: { "available": true/false }
     *
     * Note: timeSlot must be the bare HH:mm start-time, matching how timeSlots are stored.
     * The Appointment Service strips the end portion from "HH:mm-HH:mm" before calling this.
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String timeSlot) {
        boolean available = availabilityService.isDoctorAvailable(doctorId, date, timeSlot);
        return ResponseEntity.ok(Map.of("available", available));
    }

    /**
     * POST /api/doctors/{doctorId}/availability/book?date=YYYY-MM-DD&timeSlot=HH:mm
     *
     * Called by the Appointment Service (service-to-service, no user role required here —
     * the API Gateway only exposes this internally) to mark a slot as booked.
     * Uses atomic $addToSet so concurrent requests cannot double-book.
     *
     * Note: timeSlot must be the bare HH:mm start-time, e.g. "09:00".
     */
    @PostMapping("/book")
    public ResponseEntity<Void> bookSlot(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String timeSlot) {
        availabilityService.bookSlot(doctorId, date, timeSlot);
        return ResponseEntity.ok().build();
    }
}
