package com.healthcare.telemedicine_service.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "video_sessions")
public class VideoSession {

    @Id
    private String id;

    private String appointmentId;
    private String patientId;
    private String doctorId;
    private String roomName;      // unique Jitsi room name
    private String meetingUrl;    // full Jitsi URL
    private String status;        // CREATED, ACTIVE, COMPLETED
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}