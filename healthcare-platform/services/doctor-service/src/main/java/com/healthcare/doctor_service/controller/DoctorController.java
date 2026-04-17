package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.DoctorRequest;
import com.healthcare.doctor_service.dto.DoctorResponse;
import com.healthcare.doctor_service.dto.DoctorUpdateRequest;
import com.healthcare.doctor_service.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    /**
     * POST /api/doctors/register
     * Authenticated endpoint — requires a valid JWT with role DOCTOR.
     * The userId (MongoDB ObjectId from auth-service) is extracted from the JWT claims,
     * not from the request body or any manually supplied header.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponse> registerDoctor(
            @Valid @RequestBody DoctorRequest request) {
        String userId = (String) SecurityContextHolder.getContext().getAuthentication().getDetails();
        DoctorResponse response = doctorService.registerDoctor(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/doctors
     * Retrieve all doctors. Authenticated users may browse.
     */
    @GetMapping
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    /**
     * GET /api/doctors/{id}
     * Retrieve a single doctor by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    /**
     * GET /api/doctors/user/{userId}
     * Look up a doctor profile by their auth-service userId.
     * Used by other services (e.g. Appointment Service) to resolve userId → doctorId.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<DoctorResponse> getDoctorByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(doctorService.getDoctorByUserId(userId));
    }

    /**
     * PATCH /api/doctors/{id}
     * Partially update doctor profile. Only the owning doctor can update their own profile.
     * Only non-null fields in the request body will be applied.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponse> updateDoctor(
            @PathVariable String id,
            @Valid @RequestBody DoctorUpdateRequest request) {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getDetails();
        DoctorResponse response = doctorService.updateDoctor(id, request, currentUserId);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/doctors/{id}
     * Delete a doctor record. Admin only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDoctor(@PathVariable String id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }

    // --- Admin Verification Endpoints ---

    /**
     * PUT /api/doctors/{id}/verify/approve
     * Admin approves a doctor's registration.
     */
    @PutMapping("/{id}/verify/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponse> approveDoctor(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.approveDoctor(id));
    }

    /**
     * PUT /api/doctors/{id}/verify/reject
     * Admin rejects a doctor's registration.
     */
    @PutMapping("/{id}/verify/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponse> rejectDoctor(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.rejectDoctor(id));
    }

    /**
     * GET /api/doctors/verification?status=PENDING|APPROVED|REJECTED
     * Admin retrieves doctors by verification status.
     */
    @GetMapping("/verification")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DoctorResponse>> getDoctorsByStatus(
            @RequestParam(defaultValue = "PENDING") String status) {
        return ResponseEntity.ok(doctorService.getDoctorsByVerificationStatus(status));
    }
}
