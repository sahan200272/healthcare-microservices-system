package com.healthcare.patient_service.controller;

import com.healthcare.patient_service.dto.PatientRequest;
import com.healthcare.patient_service.dto.PatientResponse;
import com.healthcare.patient_service.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    // Create patient profile — PATIENT only
    @PostMapping("/api/patients")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientResponse> createPatientProfile(@Valid @RequestBody PatientRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        return new ResponseEntity<>(patientService.createPatient(request, currentUserId), HttpStatus.CREATED);
    }

    // Get patient by patientId — any authenticated user (Doctor, Admin, Patient)
    @GetMapping("/api/patients/{patientId}")
    public ResponseEntity<PatientResponse> getPatientProfile(@PathVariable String patientId) {
        return ResponseEntity.ok(patientService.getPatientById(patientId));
    }

    // Get patient by userId (Auth Service userId) — any authenticated user
    @GetMapping("/api/patients/by-user/{userId}")
    public ResponseEntity<PatientResponse> getPatientByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(patientService.getPatientByUserId(userId));
    }

    // Update patient profile — PATIENT only (own profile)
    @PutMapping("/api/patients/{patientId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientResponse> updatePatientProfile(
            @PathVariable String patientId,
            @Valid @RequestBody PatientRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(patientService.updatePatient(patientId, request, currentUserId));
    }
}
