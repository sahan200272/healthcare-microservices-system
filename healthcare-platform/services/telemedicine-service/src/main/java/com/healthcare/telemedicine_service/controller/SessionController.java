package com.healthcare.telemedicine_service.controller;

import com.healthcare.telemedicine_service.dto.SessionRequest;
import com.healthcare.telemedicine_service.model.VideoSession;
import com.healthcare.telemedicine_service.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @PostMapping("/create")
    public ResponseEntity<VideoSession> createSession(@RequestBody SessionRequest request) {
        log.info("📹 [SessionController] Received create session request");
        log.info("   AppointmentId: {}", request.getAppointmentId());
        log.info("   PatientId: {}", request.getPatientId());
        log.info("   DoctorId: {}", request.getDoctorId());
        
        try {
            log.info("   [BEFORE] Calling sessionService.createSession()...");
            VideoSession session = sessionService.createSession(request);
            log.info("   [AFTER] Returned from sessionService.createSession()");
            
            if (session == null) {
                log.error("❌ [SessionController] sessionService.createSession() returned NULL");
                return ResponseEntity.status(500).body(null);
            }
            
            log.info("✅ [SessionController] Session created successfully: {}", session.getId());
            log.info("   Session details - Room: {}, URL: {}, Status: {}", 
                     session.getRoomName(), session.getMeetingUrl(), session.getStatus());
            
            return ResponseEntity.ok(session);
        } catch (Exception ex) {
            log.error("❌ [SessionController] Error creating session: {}", ex.getMessage(), ex);
            log.error("   Exception Type: {}", ex.getClass().getName());
            throw ex;
        }
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoSession> getByAppointment(@PathVariable String appointmentId) {
        log.info("Fetching session for appointment: {}", appointmentId);
        return ResponseEntity.ok(sessionService.getSessionByAppointment(appointmentId));
    }

    @PutMapping("/{sessionId}/start")
    public ResponseEntity<VideoSession> startSession(@PathVariable String sessionId) {
        log.info("Starting session: {}", sessionId);
        return ResponseEntity.ok(sessionService.startSession(sessionId));
    }

    @PutMapping("/{sessionId}/end")
    public ResponseEntity<VideoSession> endSession(@PathVariable String sessionId) {
        log.info("Ending session: {}", sessionId);
        return ResponseEntity.ok(sessionService.endSession(sessionId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<VideoSession>> getPatientSessions(@PathVariable String patientId) {
        log.info("Fetching sessions for patient: {}", patientId);
        return ResponseEntity.ok(sessionService.getPatientSessions(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<VideoSession>> getDoctorSessions(@PathVariable String doctorId) {
        log.info("Fetching sessions for doctor: {}", doctorId);
        return ResponseEntity.ok(sessionService.getDoctorSessions(doctorId));
    }
}