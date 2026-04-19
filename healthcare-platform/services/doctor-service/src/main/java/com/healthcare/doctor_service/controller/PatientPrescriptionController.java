package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.PrescriptionResponse;
import com.healthcare.doctor_service.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Patient-facing prescription endpoint exposed under the /api/doctors namespace.
 *
 * GET /api/doctors/prescriptions/patient/{patientId}
 *
 * Allows authenticated patients (and doctors/admins) to fetch ALL prescriptions
 * ever issued for a given patient directly from the Doctor Service's authoritative
 * prescriptions collection.
 *
 * This is the fallback read path so that prescriptions issued BEFORE the
 * patient-service mirroring was implemented are still visible to the patient.
 */
@RestController
@RequestMapping("/api/doctors/prescriptions")
@RequiredArgsConstructor
public class PatientPrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * GET /api/doctors/prescriptions/patient/{patientId}
     * Returns all prescriptions for the given patient ID (as stored in the
     * Doctor Service's database).
     *
     * Security: any authenticated user may call this endpoint.
     * Fine-grained ownership checks (ensure patient only sees their own data)
     * are left to the API Gateway JWT filter.
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionsByPatient(
            @PathVariable String patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatient(patientId));
    }
}
