package com.healthcare.telemedicine_service.controller;

import com.healthcare.telemedicine_service.dto.SessionRequest;
import com.healthcare.telemedicine_service.model.VideoSession;
import com.healthcare.telemedicine_service.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    public ResponseEntity<VideoSession> createSession(@RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.createSession(request));
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT', 'ADMIN')")
    public ResponseEntity<VideoSession> getByAppointment(@PathVariable String appointmentId) {
        return ResponseEntity.ok(sessionService.getSessionByAppointment(appointmentId));
    }

    @PutMapping("/{sessionId}/start")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<VideoSession> startSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.startSession(sessionId));
    }

    @PutMapping("/{sessionId}/end")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<VideoSession> endSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.endSession(sessionId));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<VideoSession>> getPatientSessions(@PathVariable String patientId) {
        return ResponseEntity.ok(sessionService.getPatientSessions(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<VideoSession>> getDoctorSessions(@PathVariable String doctorId) {
        return ResponseEntity.ok(sessionService.getDoctorSessions(doctorId));
    }
}