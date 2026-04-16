package com.healthcare.telemedicine_service.service;

import com.healthcare.telemedicine_service.dto.SessionRequest;
import com.healthcare.telemedicine_service.model.VideoSession;
import com.healthcare.telemedicine_service.repository.VideoSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    @Autowired
    private VideoSessionRepository sessionRepository;

    @Value("${jitsi.base-url:https://meet.jitsi.iscom.ch}")
    private String jitsiBaseUrl;

    // Create a new video session for an appointment
    public VideoSession createSession(SessionRequest request) {
        try {
            log.info("📹 [SessionService] Starting to create video session for appointment: {}", request.getAppointmentId());
            log.debug("Request details - PatientId: {}, DoctorId: {}", request.getPatientId(), request.getDoctorId());

            // Validate request
            if (request.getAppointmentId() == null || request.getAppointmentId().isEmpty()) {
                log.error("❌ [SessionService] AppointmentId is null or empty");
                throw new RuntimeException("AppointmentId cannot be null or empty");
            }

            // Check if session already exists for this appointment
            var existingSession = sessionRepository.findByAppointmentId(request.getAppointmentId());
            if (existingSession.isPresent()) {
                log.warn("⚠️  [SessionService] Session already exists for this appointment: {}", request.getAppointmentId());
                throw new RuntimeException("Session already exists for this appointment");
            }

            // Generate a unique room name
            String roomName = "healthcare-" + UUID.randomUUID().toString().substring(0, 8);
            String meetingUrl = jitsiBaseUrl + "/" + roomName;

            log.info("[SessionService] Generated room name: {}", roomName);
            log.info("[SessionService] Meeting URL: {}", meetingUrl);

            VideoSession session = new VideoSession();
            session.setAppointmentId(request.getAppointmentId());
            session.setPatientId(request.getPatientId());
            session.setDoctorId(request.getDoctorId());
            session.setRoomName(roomName);
            session.setMeetingUrl(meetingUrl);
            session.setStatus("CREATED");
            session.setCreatedAt(LocalDateTime.now());

            log.info("[SessionService] VideoSession object created (before save):");
            log.info("   - AppointmentId: {}", session.getAppointmentId());
            log.info("   - PatientId: {}", session.getPatientId());
            log.info("   - DoctorId: {}", session.getDoctorId());
            log.info("   - RoomName: {}", session.getRoomName());
            log.info("   - Status: {}", session.getStatus());

            log.info("[SessionService] [BEFORE] Calling sessionRepository.save()...");
            VideoSession savedSession = sessionRepository.save(session);
            log.info("[SessionService] [AFTER] Returned from sessionRepository.save()");

            if (savedSession == null) {
                log.error("❌ [SessionService] sessionRepository.save() returned NULL");
                throw new RuntimeException("Failed to save VideoSession - repository returned null");
            }

            log.info("[SessionService] Saved VideoSession details:");
            log.info("   - ID: {}", savedSession.getId());
            log.info("   - AppointmentId: {}", savedSession.getAppointmentId());
            log.info("   - RoomName: {}", savedSession.getRoomName());
            log.info("   - Status: {}", savedSession.getStatus());
            
            log.info("✅ [SessionService] Video session created successfully with ID: {}", savedSession.getId());

            return savedSession;
        } catch (Exception ex) {
            log.error("❌ [SessionService] Error creating video session: {}", ex.getMessage(), ex);
            log.error("   Exception Type: {}", ex.getClass().getName());
            throw ex;
        }
    }

    // Get session by appointment ID
    public VideoSession getSessionByAppointment(String appointmentId) {
        log.debug("Fetching session for appointment: {}", appointmentId);
        return sessionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> {
                    log.error("Session not found for appointment: {}", appointmentId);
                    return new RuntimeException("Session not found");
                });
    }

    // Start the session
    public VideoSession startSession(String sessionId) {
        log.info("Starting session: {}", sessionId);
        VideoSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> {
                    log.error("Session not found: {}", sessionId);
                    return new RuntimeException("Session not found");
                });
        session.setStatus("ACTIVE");
        session.setStartedAt(LocalDateTime.now());
        VideoSession updated = sessionRepository.save(session);
        log.info("✅ Session started: {}", sessionId);
        return updated;
    }

    // End the session
    public VideoSession endSession(String sessionId) {
        log.info("Ending session: {}", sessionId);
        VideoSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> {
                    log.error("Session not found: {}", sessionId);
                    return new RuntimeException("Session not found");
                });
        session.setStatus("COMPLETED");
        session.setEndedAt(LocalDateTime.now());
        VideoSession updated = sessionRepository.save(session);
        log.info("✅ Session ended: {}", sessionId);
        return updated;
    }

    // Get all sessions for a patient
    public List<VideoSession> getPatientSessions(String patientId) {
        log.debug("Fetching sessions for patient: {}", patientId);
        List<VideoSession> sessions = sessionRepository.findByPatientId(patientId);
        log.info("Found {} sessions for patient: {}", sessions.size(), patientId);
        return sessions;
    }

    // Get all sessions for a doctor
    public List<VideoSession> getDoctorSessions(String doctorId) {
        log.debug("Fetching sessions for doctor: {}", doctorId);
        List<VideoSession> sessions = sessionRepository.findByDoctorId(doctorId);
        log.info("Found {} sessions for doctor: {}", sessions.size(), doctorId);
        return sessions;
    }
}