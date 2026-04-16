package com.healthcare.appointment_service.client;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import com.healthcare.appointment_service.security.SecurityUtils;
import org.springframework.http.HttpHeaders;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelemedicineServiceClient {

    @Autowired
    private WebClient webClient;

    @Value("${clients.telemedicine-service.base-url:http://localhost:8087}")
    private String telemedicineServiceBaseUrl;

    /**
     * Create a video session for a video consultation appointment
     */
    public VideoSessionResponse createVideoSession(String appointmentId, String patientId, String doctorId) {
        try {
            log.info("📹 [TelemedicineServiceClient] Creating video session for appointment: {}", appointmentId);
            log.info("   Telemedicine Service URL: {}", telemedicineServiceBaseUrl);
            log.info("   PatientId: {}, DoctorId: {}", patientId, doctorId);
            
            SessionRequest request = SessionRequest.builder()
                    .appointmentId(appointmentId)
                    .patientId(patientId)
                    .doctorId(doctorId)
                    .build();

            log.info("   Sending POST request to: {}/api/sessions/create", telemedicineServiceBaseUrl);

            String token = SecurityUtils.currentToken().orElse(null);
            if (token == null) {
                log.warn("⚠️  [TelemedicineServiceClient] No JWT token found in security context!");
            }

            VideoSessionResponse response = webClient.post()
                    .uri(telemedicineServiceBaseUrl + "/api/sessions/create")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), clientResponse -> {
                        log.error(" [TelemedicineServiceClient] HTTP Error Status: {}", clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .doOnNext(errorBody -> log.error("   Error Response Body: {}", errorBody))
                                .flatMap(errorBody -> null);
                    })
                    .bodyToMono(VideoSessionResponse.class)
                    .doOnNext(resp -> {
                        if (resp != null) {
                            log.info("Response received - ID: {}", resp.getId());
                        } else {
                            log.warn("Response body is null");
                        }
                    })
                    .doOnError(ex -> {
                        log.error("[TelemedicineServiceClient] Error during deserialization or request: {} - {}",
                                  ex.getClass().getSimpleName(), ex.getMessage());
                        log.error("   Full error: ", ex);
                    })
                    .onErrorResume(ex -> {
                        log.error("[TelemedicineServiceClient] Failed to create video session (recovered): {} - {}",
                                  ex.getClass().getSimpleName(), ex.getMessage());
                        return null;
                    })
                    .blockOptional()
                    .orElse(null);

            if (response != null && response.getId() != null) {
                log.info("[TelemedicineServiceClient] Video session created successfully: {}", response.getId());
                log.info("   Room: {}, URL: {}", response.getRoomName(), response.getMeetingUrl());
            } else {
                log.warn("[TelemedicineServiceClient] Video session creation returned null response");
            }
            
            return response;
        } catch (Exception ex) {
            log.error("[TelemedicineServiceClient] Exception while creating video session: {}", ex.getMessage());
            log.error("   Stack trace: ", ex);
            return null;
        }
    }

    @Data
    @Builder
    public static class SessionRequest {
        private String appointmentId;
        private String patientId;
        private String doctorId;
    }

    @Data
    public static class VideoSessionResponse {
        private String id;
        private String appointmentId;
        private String patientId;
        private String doctorId;
        private String roomName;
        private String meetingUrl;
        private String status;
        private String createdAt;
        private String startedAt;
        private String endedAt;
    }
}
