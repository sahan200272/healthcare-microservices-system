package com.healthcare.telemedicine_service.controller;

import com.healthcare.telemedicine_service.dto.SessionActivateResponse;
import com.healthcare.telemedicine_service.dto.SessionRequest;
import com.healthcare.telemedicine_service.model.VideoSession;
import com.healthcare.telemedicine_service.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    @Autowired
    private SessionService sessionService;

    // ── Create a new session ──────────────────────────────────────────────────
    @PostMapping("/create")
    public ResponseEntity<VideoSession> createSession(@RequestBody SessionRequest request) {
        log.info("📹 [SessionController] Create session — appointmentId: {}", request.getAppointmentId());
        try {
            VideoSession session = sessionService.createSession(request);
            if (session == null) {
                log.error("❌ sessionService.createSession() returned null");
                return ResponseEntity.status(500).body(null);
            }
            log.info("✅ Session created: {}", session.getId());
            return ResponseEntity.ok(session);
        } catch (Exception ex) {
            log.error("❌ Error creating session: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    // ── Activate a session by appointment ID (DOCTOR only) ────────────────────
    /**
     * POST /api/sessions/{appointmentId}/activate
     *
     * Called by the doctor's "Start Consultation" button.
     * Finds the video_session for this appointment (or auto-creates one),
     * sets status = ACTIVE, persists to MongoDB, and returns the meetingUrl.
     */
    @PostMapping("/{appointmentId}/activate")
    public ResponseEntity<SessionActivateResponse> activateByAppointmentId(
            @PathVariable String appointmentId) {
        log.info("▶ [SessionController] activate — appointmentId: {}", appointmentId);
        try {
            SessionActivateResponse response = sessionService.activateSession(appointmentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.error("❌ activateSession failed: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null); // 409 if COMPLETED
        }
    }

    // ── Get session by appointment ID ─────────────────────────────────────────
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getByAppointment(@PathVariable String appointmentId) {
        log.info("🔍 [SessionController] getByAppointment — appointmentId: {}", appointmentId);
        try {
            VideoSession session = sessionService.getSessionByAppointment(appointmentId);
            return ResponseEntity.ok(session);
        } catch (RuntimeException ex) {
            log.warn("⚠️  Session not found for appointment: {}", appointmentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No session found for appointmentId: " + appointmentId));
        }
    }

    // ── Start a session by session ID (legacy — kept for backward compat) ─────
    @PutMapping("/{sessionId}/start")
    public ResponseEntity<VideoSession> startSession(@PathVariable String sessionId) {
        log.info("Starting session by sessionId: {}", sessionId);
        return ResponseEntity.ok(sessionService.startSession(sessionId));
    }

    // ── End a session ─────────────────────────────────────────────────────────
    @PutMapping("/{sessionId}/end")
    public ResponseEntity<VideoSession> endSession(@PathVariable String sessionId) {
        log.info("Ending session: {}", sessionId);
        return ResponseEntity.ok(sessionService.endSession(sessionId));
    }

    // ── Patient sessions ──────────────────────────────────────────────────────
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<VideoSession>> getPatientSessions(@PathVariable String patientId) {
        log.info("Fetching sessions for patient: {}", patientId);
        return ResponseEntity.ok(sessionService.getPatientSessions(patientId));
    }

    // ── Doctor sessions ───────────────────────────────────────────────────────
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<VideoSession>> getDoctorSessions(@PathVariable String doctorId) {
        log.info("Fetching sessions for doctor: {}", doctorId);
        return ResponseEntity.ok(sessionService.getDoctorSessions(doctorId));
    }
}