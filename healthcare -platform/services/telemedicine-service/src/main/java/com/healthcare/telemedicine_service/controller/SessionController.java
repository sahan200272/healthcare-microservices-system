package com.healthcare.telemedicine_service.controller;

import com.healthcare.telemedicine_service.dto.SessionRequest;
import com.healthcare.telemedicine_service.model.VideoSession;
import com.healthcare.telemedicine_service.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // Create session (called when appointment is confirmed)
    @PostMapping("/create")
    public ResponseEntity<VideoSession> createSession(@RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.createSession(request));
    }

    // Get session by appointment
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoSession> getByAppointment(@PathVariable String appointmentId) {
        return ResponseEntity.ok(sessionService.getSessionByAppointment(appointmentId));
    }

    // Start session
    @PutMapping("/{sessionId}/start")
    public ResponseEntity<VideoSession> startSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.startSession(sessionId));
    }

    // End session
    @PutMapping("/{sessionId}/end")
    public ResponseEntity<VideoSession> endSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.endSession(sessionId));
    }

    // Get all sessions for a patient
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<VideoSession>> getPatientSessions(@PathVariable String patientId) {
        return ResponseEntity.ok(sessionService.getPatientSessions(patientId));
    }

    // Get all sessions for a doctor
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<VideoSession>> getDoctorSessions(@PathVariable String doctorId) {
        return ResponseEntity.ok(sessionService.getDoctorSessions(doctorId));
    }
}
