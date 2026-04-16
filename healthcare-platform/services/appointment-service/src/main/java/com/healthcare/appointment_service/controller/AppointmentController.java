//healthcare-platform/services/appointment-service/src/main/java/com/healthcare/appointment_service/controller/AppointmentController.java

package com.healthcare.appointment_service.controller;

import com.healthcare.appointment_service.dto.AppointmentRequest;
import com.healthcare.appointment_service.dto.AppointmentResponse;
import com.healthcare.appointment_service.dto.RescheduleAppointmentRequest;
import com.healthcare.appointment_service.exception.ForbiddenException;
import com.healthcare.appointment_service.security.SecurityUtils;
import com.healthcare.appointment_service.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Validated
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    // 1. Create Appointment
    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
        enforceSelfIfPresent(request.getPatientId());
        return ResponseEntity.ok(appointmentService.createAppointment(request));
    }

    // 2. View Appointment by ID
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    // 3. View Appointments by Patient ID
    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getByPatient(@PathVariable String patientId) {
        enforceSelfIfPresent(patientId);
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
    }

    // 4. View Appointments by Doctor ID
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getByDoctor(@PathVariable String doctorId) {
        enforceSelfIfPresent(doctorId);
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    // 5. Confirm Appointment (Doctor role only)
    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/confirm")
    public ResponseEntity<AppointmentResponse> confirm(@PathVariable String id) {
        String doctorId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        return ResponseEntity.ok(appointmentService.confirmAppointment(id, doctorId));
    }

    // 6. Cancel Appointment (Patient role only)
    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable String id) {
        String patientId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, patientId));
    }

    // 7. Reschedule Appointment
    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(
            @PathVariable String id,
            @Valid @RequestBody RescheduleAppointmentRequest request
    ) {
        String patientId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, patientId, request));
    }

    // 8. Admin view all appointments
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAll() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    private void enforceSelfIfPresent(String pathOrBodyId) {
        // In this project, tokens might include "userId"; if present, enforce "own" access.
        SecurityUtils.currentUserId().ifPresent(jwtUserId -> {
            if (!jwtUserId.equals(pathOrBodyId)) {
                throw new ForbiddenException("You can only access your own resources");
            }
        });
    }
}