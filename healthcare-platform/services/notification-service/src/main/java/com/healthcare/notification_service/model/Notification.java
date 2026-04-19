package com.healthcare.notification_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;
    private String patientId;
    private String doctorId;
    private String appointmentId;
    private NotificationType type;
    private String message;
    private String link;
    private LocalDateTime createdAt;
    private boolean isRead;
}
