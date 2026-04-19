package com.healthcare.notification_service.service;

import com.healthcare.notification_service.dto.NotificationRequest;
import com.healthcare.notification_service.dto.NotificationResponse;
import com.healthcare.notification_service.model.Notification;
import com.healthcare.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationResponse sendNotification(NotificationRequest request) {
        log.info("Sending notification of type: {} for appointment: {}", request.getType(), request.getAppointmentId());

        String message = "";
        String link = null;

        switch (request.getType()) {
            case VIDEO_CONSULTATION_LINK:
                message = "Your video consultation link";
                link = "https://meet.jit.si/" + request.getAppointmentId();
                break;
            case APPOINTMENT_PENDING:
                message = "New appointment request pending approval";
                break;
            case APPOINTMENT_CONFIRMED:
                message = "Your appointment has been confirmed by the doctor";
                break;
            case PAYMENT_SUCCESS:
                message = "Payment successful";
                break;
            case PAYMENT_FAILED:
                message = "Payment failed";
                break;
            default:
                message = "You have a new notification";
        }

        if (request.getAdditionalMessage() != null && !request.getAdditionalMessage().isEmpty()) {
            message += " - " + request.getAdditionalMessage();
        }

        Notification notification = Notification.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentId(request.getAppointmentId())
                .type(request.getType())
                .message(message)
                .link(link)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification saved successfully with ID: {}", savedNotification.getId());

        return mapToResponse(savedNotification);
    }

    public List<NotificationResponse> getNotificationsForPatient(String patientId) {
        log.info("Fetching notifications for patient: {}", patientId);
        return notificationRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getNotificationsForDoctor(String doctorId) {
        log.info("Fetching notifications for doctor: {}", doctorId);
        return notificationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public NotificationResponse markAsRead(String id) {
        log.info("Marking notification as read: {}", id);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        notification.setRead(true);
        return mapToResponse(notificationRepository.save(notification));
    }

    public void deleteNotification(String id) {
        log.info("Deleting notification: {}", id);
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    public NotificationResponse getNotificationById(String id) {
        log.info("Fetching notification: {}", id);
        return notificationRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    public List<NotificationResponse> getAllNotifications() {
        log.info("Fetching all notifications");
        return notificationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .patientId(notification.getPatientId())
                .doctorId(notification.getDoctorId())
                .appointmentId(notification.getAppointmentId())
                .type(notification.getType())
                .message(notification.getMessage())
                .link(notification.getLink())
                .createdAt(notification.getCreatedAt())
                .read(notification.isRead())
                .build();
    }
}
