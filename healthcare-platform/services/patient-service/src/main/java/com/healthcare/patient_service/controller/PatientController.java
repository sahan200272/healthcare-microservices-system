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
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientResponse> createPatientProfile(@Valid @RequestBody PatientRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientResponse response = patientService.createPatient(request, currentUserId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<PatientResponse> getPatientProfile(@PathVariable String patientId) {
        PatientResponse response = patientService.getPatientById(patientId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<PatientResponse> getPatientProfileByUserId(@PathVariable String userId) {
        PatientResponse response = patientService.getPatientByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{patientId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientResponse> updatePatientProfile(
            @PathVariable String patientId,
            @Valid @RequestBody PatientRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientResponse response = patientService.updatePatient(patientId, request, currentUserId);
        return ResponseEntity.ok(response);
    }
}
