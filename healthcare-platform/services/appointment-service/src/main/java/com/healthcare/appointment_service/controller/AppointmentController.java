//healthcare-platform/services/appointment-service/src/main/java/com/healthcare/appointment_service/controller/AppointmentController.java

package com.healthcare.appointment_service.controller;

import com.healthcare.appointment_service.dto.AppointmentRequest;
import com.healthcare.appointment_service.dto.AppointmentResponse;
import com.healthcare.appointment_service.dto.RescheduleAppointmentRequest;
import com.healthcare.appointment_service.exception.ForbiddenException;
import com.healthcare.appointment_service.security.SecurityUtils;
import com.healthcare.appointment_service.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Validated
public class AppointmentController {

    private final AppointmentService appointmentService;

    // 1. Create Appointment
    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
        log.info("📝 Creating appointment for patient: {}", request.getPatientId());
        enforceSelfIfPresent(request.getPatientId());
        AppointmentResponse response = appointmentService.createAppointment(request);
        log.info("✅ Appointment created: {}", response.getId());
        return ResponseEntity.ok(response);
    }

    // 2. View Appointment by ID
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable String id) {
        log.debug("🔍 Fetching appointment: {}", id);
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(response);
    }

    // 3. View Appointments by Patient ID
    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getByPatient(@PathVariable String patientId) {
        log.info("📋 Fetching appointments for patient: {}", patientId);
        
        try {
            // Authorization check: ensure user only accesses their own data
            enforceSelfIfPresent(patientId);
            log.debug("✅ Authorization check passed for patient: {}", patientId);
            
            // Fetch appointments
            List<AppointmentResponse> appointments = appointmentService.getPatientAppointments(patientId);
            log.info("✅ Retrieved {} appointments for patient: {}", 
                    appointments != null ? appointments.size() : 0, patientId);
            
            return ResponseEntity.ok(appointments);
        } catch (ForbiddenException ex) {
            log.warn("🔒 Authorization failed for patient: {}", patientId);
            throw ex;
        } catch (Exception ex) {
            log.error("❌ Error fetching appointments for patient: {}", patientId, ex);
            throw ex;
        }
    }

    // 4. View Appointments by Doctor ID
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getByDoctor(
            @PathVariable String doctorId,
            @RequestHeader("Authorization") String authHeader) {
        log.info("📋 Fetching appointments for doctor: {}", doctorId);

        String userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        String token = authHeader.substring(7);

        // Ownership is verified by the AppointmentService via the DoctorService
        List<AppointmentResponse> appointments = appointmentService.getDoctorAppointments(doctorId, userId, token);
        log.info("✅ Retrieved {} appointments for doctor: {}", 
                appointments != null ? appointments.size() : 0, doctorId);
        return ResponseEntity.ok(appointments);
    }

    // 5. Accept Appointment (Doctor role only) — PENDING → ACCEPTED
    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/accept")
    public ResponseEntity<AppointmentResponse> accept(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        String userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        String token = authHeader.substring(7);
        return ResponseEntity.ok(appointmentService.acceptAppointment(id, userId, token));
    }

// 5b. Confirm Appointment (Doctor role only)
@PreAuthorize("hasRole('DOCTOR')")
@PutMapping("/{id}/confirm")
public ResponseEntity<AppointmentResponse> confirm(
        @PathVariable String id,
        @RequestHeader("Authorization") String authHeader) {

    String userId = SecurityUtils.currentUserId()
            .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));

    String token = authHeader.substring(7);

    return ResponseEntity.ok(
            appointmentService.confirmAppointment(id, userId, token)
    );
}

// 5c. Reject Appointment (Doctor role only)
@PreAuthorize("hasRole('DOCTOR')")
@PutMapping("/{id}/reject")
public ResponseEntity<AppointmentResponse> reject(
        @PathVariable String id,
        @RequestHeader("Authorization") String authHeader) {

    String userId = SecurityUtils.currentUserId()
            .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));

    String token = authHeader.substring(7);

    return ResponseEntity.ok(
            appointmentService.rejectAppointment(id, userId, token)
    );
}

    // 6. Cancel Appointment (Patient role only)
    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable String id) {
        log.info("❌ Cancelling appointment: {}", id);
        String patientId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        AppointmentResponse response = appointmentService.cancelAppointment(id, patientId);
        log.info("✅ Appointment cancelled: {}", id);
        return ResponseEntity.ok(response);
    }

    // 7. Reschedule Appointment
    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(
            @PathVariable String id,
            @Valid @RequestBody RescheduleAppointmentRequest request
    ) {
        log.info("🔄 Rescheduling appointment: {} to date: {}, slot: {}", 
                id, request.getAppointmentDate(), request.getTimeSlot());
        String patientId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new ForbiddenException("Missing userId claim in JWT"));
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, patientId, request);
        log.info("✅ Appointment rescheduled: {}", id);
        return ResponseEntity.ok(response);
    }

    // 8. Admin view all appointments
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAll() {
        log.info("👨‍💼 Admin fetching all appointments");
        List<AppointmentResponse> appointments = appointmentService.getAllAppointments();
        log.info("✅ Retrieved {} total appointments", 
                appointments != null ? appointments.size() : 0);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Enforces that the current user can only access their own resources.
     * Throws ForbiddenException if userId is present in JWT but doesn't match the requested ID.
     * 
     * @param requestedId The ID being accessed (patientId, doctorId, etc.)
     * @throws ForbiddenException if user's ID doesn't match the requested ID
     */
    private void enforceSelfIfPresent(String requestedId) {
        SecurityUtils.currentUserId().ifPresent(currentUserId -> {
            if (!currentUserId.equals(requestedId)) {
                log.warn("🔒 Unauthorized access attempt. currentUserId: {}, requestedId: {}", 
                        currentUserId, requestedId);
                throw new ForbiddenException("You can only access your own resources");
            }
        });
    }
}