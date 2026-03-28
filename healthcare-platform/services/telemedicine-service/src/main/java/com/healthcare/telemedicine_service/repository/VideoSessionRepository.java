package com.healthcare.telemedicine_service.repository;

import com.healthcare.telemedicine_service.model.VideoSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface VideoSessionRepository extends MongoRepository<VideoSession, String> {
    Optional<VideoSession> findByAppointmentId(String appointmentId);
    List<VideoSession> findByPatientId(String patientId);
    List<VideoSession> findByDoctorId(String doctorId);
}
