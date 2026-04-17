package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.MedicalReportResponse;
import com.healthcare.doctor_service.dto.PatientDetailsResponse;
import com.healthcare.doctor_service.service.PatientClientService;
import com.healthcare.doctor_service.service.PatientReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors/{doctorId}/patients")
@RequiredArgsConstructor
public class PatientViewController {

    private final PatientClientService patientClientService;
    private final PatientReportService patientReportService;

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

    /**
     * GET /api/doctors/{doctorId}/patients/{patientId}/reports
     * Doctor fetches all medical reports uploaded by the patient.
     *
     * Authorization:
     *  - DOCTOR role required (JWT).
     *  - Requesting doctor must be APPROVED (verified in PatientReportService).
     *
     * [INTEGRATION POINT] Calls Patient Service: GET /api/patients/{patientId}/reports
     */
    @GetMapping("/{patientId}/reports")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<MedicalReportResponse>> getPatientReports(
            @PathVariable String doctorId,
            @PathVariable String patientId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        List<MedicalReportResponse> reports =
                patientReportService.getPatientReports(doctorId, patientId, token);
        return ResponseEntity.ok(reports);
    }
}
