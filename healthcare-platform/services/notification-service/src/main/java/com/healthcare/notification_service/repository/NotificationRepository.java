package com.healthcare.notification_service.repository;

import com.healthcare.notification_service.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByPatientIdOrderByCreatedAtDesc(String patientId);
    List<Notification> findByDoctorIdOrderByCreatedAtDesc(String doctorId);
}
