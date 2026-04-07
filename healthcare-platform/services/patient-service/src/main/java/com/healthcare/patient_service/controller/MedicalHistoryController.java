package com.healthcare.patient_service.controller;

import com.healthcare.patient_service.dto.MedicalHistoryRequest;
import com.healthcare.patient_service.dto.MedicalHistoryResponse;
import com.healthcare.patient_service.service.MedicalHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/history")
@RequiredArgsConstructor
public class MedicalHistoryController {

    private final MedicalHistoryService medicalHistoryService;

    // PATIENT adds their own medical history
    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalHistoryResponse> addMedicalHistory(
            @PathVariable String patientId,
            @Valid @RequestBody MedicalHistoryRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        return new ResponseEntity<>(medicalHistoryService.addMedicalHistory(patientId, request, currentUserId), HttpStatus.CREATED);
    }

    // Any authenticated user can view medical history
    @GetMapping
    public ResponseEntity<List<MedicalHistoryResponse>> getMedicalHistory(@PathVariable String patientId) {
        return ResponseEntity.ok(medicalHistoryService.getMedicalHistory(patientId));
    }
}
