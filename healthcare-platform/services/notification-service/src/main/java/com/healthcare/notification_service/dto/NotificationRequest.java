package com.healthcare.notification_service.dto;

import com.healthcare.notification_service.model.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {
    private String patientId;
    private String doctorId;
    
    private String appointmentId;
    
    @NotNull(message = "Notification type is required")
    private NotificationType type;
    
    private String additionalMessage;
}
