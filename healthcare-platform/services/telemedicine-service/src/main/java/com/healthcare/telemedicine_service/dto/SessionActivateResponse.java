package com.healthcare.telemedicine_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned when a doctor activates (starts) a video session.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionActivateResponse {
    private String sessionId;
    private String appointmentId;
    private String meetingUrl;
    private String status;
}
