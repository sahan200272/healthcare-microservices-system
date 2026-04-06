package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.PrescriptionRequest;
import com.healthcare.doctor_service.dto.PrescriptionResponse;
import com.healthcare.doctor_service.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors/{doctorId}/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * POST /api/doctors/{doctorId}/prescriptions
     * Issue a digital prescription for a patient after a consultation.
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> issuePrescription(
            @PathVariable String doctorId,
            @Valid @RequestBody PrescriptionRequest request,
            @RequestHeader("Authorization") String authorizationHeader) {
        String token = authorizationHeader.startsWith("Bearer ")
                ? authorizationHeader.substring(7)
                : authorizationHeader;
        PrescriptionResponse response = prescriptionService.issuePrescription(doctorId, request, token);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/doctors/{doctorId}/prescriptions
     * Retrieve all prescriptions issued by a doctor.
     */
    @GetMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionsByDoctor(
            @PathVariable String doctorId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDoctor(doctorId));
    }
}
