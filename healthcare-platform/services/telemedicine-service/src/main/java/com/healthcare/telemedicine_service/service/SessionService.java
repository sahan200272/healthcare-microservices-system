package com.healthcare.telemedicine_service.service;

import com.healthcare.telemedicine_service.dto.SessionRequest;
import com.healthcare.telemedicine_service.model.VideoSession;
import com.healthcare.telemedicine_service.repository.VideoSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    @Autowired
    private VideoSessionRepository sessionRepository;

    @Value("${jitsi.base-url}")
    private String jitsiBaseUrl;

    // Create a new video session for an appointment
    public VideoSession createSession(SessionRequest request) {

        // Check if session already exists for this appointment
        sessionRepository.findByAppointmentId(request.getAppointmentId())
                .ifPresent(s -> { throw new RuntimeException("Session already exists for this appointment"); });

        // Generate a unique room name
        String roomName = "healthcare-" + UUID.randomUUID().toString().substring(0, 8);
        String meetingUrl = jitsiBaseUrl + "/" + roomName;

        VideoSession session = new VideoSession();
        session.setAppointmentId(request.getAppointmentId());
        session.setPatientId(request.getPatientId());
        session.setDoctorId(request.getDoctorId());
        session.setRoomName(roomName);
        session.setMeetingUrl(meetingUrl);
        session.setStatus("CREATED");
        session.setCreatedAt(LocalDateTime.now());

        return sessionRepository.save(session);
    }

    // Get session by appointment ID
    public VideoSession getSessionByAppointment(String appointmentId) {
        return sessionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    // Start the session
    public VideoSession startSession(String sessionId) {
        VideoSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus("ACTIVE");
        session.setStartedAt(LocalDateTime.now());
        return sessionRepository.save(session);
    }

    // End the session
    public VideoSession endSession(String sessionId) {
        VideoSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus("COMPLETED");
        session.setEndedAt(LocalDateTime.now());
        return sessionRepository.save(session);
    }

    // Get all sessions for a patient
    public List<VideoSession> getPatientSessions(String patientId) {
        return sessionRepository.findByPatientId(patientId);
    }

    // Get all sessions for a doctor
    public List<VideoSession> getDoctorSessions(String doctorId) {
        return sessionRepository.findByDoctorId(doctorId);
    }
}