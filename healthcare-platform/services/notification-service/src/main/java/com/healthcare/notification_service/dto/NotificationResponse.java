package com.healthcare.notification_service.dto;

import com.healthcare.notification_service.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private String id;
    private String patientId;
    private String doctorId;
    private String appointmentId;
    private NotificationType type;
    private String message;
    private String link;
    private LocalDateTime createdAt;
    private boolean read;
}
