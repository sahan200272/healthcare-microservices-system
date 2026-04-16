package com.healthcare.patient_service.controller;

import com.healthcare.patient_service.dto.PrescriptionRequest;
import com.healthcare.patient_service.dto.PrescriptionResponse;
import com.healthcare.patient_service.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    // DOCTOR or ADMIN adds a prescription
    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<PrescriptionResponse> addPrescription(
            @PathVariable String patientId,
            @Valid @RequestBody PrescriptionRequest request) {
        return new ResponseEntity<>(prescriptionService.addPrescription(patientId, request), HttpStatus.CREATED);
    }

    // PATIENT views their own prescriptions (also readable by DOCTOR and ADMIN)
    @GetMapping
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptions(@PathVariable String patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatientId(patientId));
    }

    @PutMapping("/{prescriptionId}/notes")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PrescriptionResponse> updatePrescriptionNotes(
            @PathVariable String patientId,
            @PathVariable String prescriptionId,
            @RequestBody java.util.Map<String, String> body) {
        String notes = body.get("notes");
        String currentUserId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(prescriptionService.updatePrescriptionNotes(prescriptionId, notes, currentUserId));
    }
}
