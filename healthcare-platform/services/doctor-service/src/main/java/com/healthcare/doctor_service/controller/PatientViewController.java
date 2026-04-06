package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.PatientDetailsResponse;
import com.healthcare.doctor_service.service.PatientClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors/{doctorId}/patients")
@RequiredArgsConstructor
public class PatientViewController {

    private final PatientClientService patientClientService;

    /**
     * GET /api/doctors/{doctorId}/patients/{patientId}
     * Doctor views patient details before or during a consultation.
     * Proxies the call to the Patient Service.
     *
     * [INTEGRATION POINT] Calls Patient Service: GET /api/patients/{patientId}
     */
    @GetMapping("/{patientId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PatientDetailsResponse> getPatientDetails(
            @PathVariable String doctorId,
            @PathVariable String patientId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        PatientDetailsResponse response = patientClientService.getPatientDetails(patientId, token);
        return ResponseEntity.ok(response);
    }
}
