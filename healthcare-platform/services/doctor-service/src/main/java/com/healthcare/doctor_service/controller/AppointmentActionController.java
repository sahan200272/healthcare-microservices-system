package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.AppointmentActionResponse;
import com.healthcare.doctor_service.service.AppointmentClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors/{doctorId}/appointments")
@RequiredArgsConstructor
public class AppointmentActionController {

    private final AppointmentClientService appointmentClientService;

    /**
     * PUT /api/doctors/{doctorId}/appointments/{appointmentId}/accept
     * Doctor accepts a pending appointment request.
     * Delegates status update to the Appointment Service via REST.
     */
    @PutMapping("/{appointmentId}/accept")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentActionResponse> acceptAppointment(
            @PathVariable String doctorId,
            @PathVariable String appointmentId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        AppointmentActionResponse response =
                appointmentClientService.acceptAppointment(doctorId, appointmentId, token);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/doctors/{doctorId}/appointments/{appointmentId}/reject
     * Doctor rejects a pending appointment request.
     * Delegates status update to the Appointment Service via REST.
     */
    @PutMapping("/{appointmentId}/reject")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentActionResponse> rejectAppointment(
            @PathVariable String doctorId,
            @PathVariable String appointmentId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        AppointmentActionResponse response =
                appointmentClientService.rejectAppointment(doctorId, appointmentId, token);
        return ResponseEntity.ok(response);
    }
}
