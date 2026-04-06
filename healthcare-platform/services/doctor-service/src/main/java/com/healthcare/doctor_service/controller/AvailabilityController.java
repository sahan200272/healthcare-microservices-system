package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.AvailabilityRequest;
import com.healthcare.doctor_service.dto.AvailabilityResponse;
import com.healthcare.doctor_service.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
