package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.AppointmentActionResponse;
import com.healthcare.doctor_service.dto.MedicalReportResponse;
import com.healthcare.doctor_service.service.AppointmentClientService;
import com.healthcare.doctor_service.service.PatientReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors/{doctorId}/appointments")
@RequiredArgsConstructor
public class AppointmentActionController {

    private final AppointmentClientService appointmentClientService;
    private final PatientReportService patientReportService;

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

    /**
     * GET /api/doctors/{doctorId}/appointments/{appointmentId}/reports
     * Fetches all medical reports for the patient linked to this appointment.
     *
     * Authorization:
     *  - DOCTOR role required (JWT).
     *  - Requesting doctor must be APPROVED.
     *  - The appointment must belong to the requesting doctor
     *    (verified via Appointment Service — unauthorized doctors get 403).
     *
     * [INTEGRATION POINT] Appointment Service: GET /api/appointments/{appointmentId}
     * [INTEGRATION POINT] Patient Service:     GET /api/patients/{patientId}/reports
     */
    @GetMapping("/{appointmentId}/reports")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<MedicalReportResponse>> getReportsByAppointment(
            @PathVariable String doctorId,
            @PathVariable String appointmentId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        List<MedicalReportResponse> reports =
                patientReportService.getReportsByAppointment(doctorId, appointmentId, token);
        return ResponseEntity.ok(reports);
    }
}
