package com.healthcare.appointment_service.client;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class NotificationServiceClient {
    private final WebClient webClient;

    @Value("${clients.notification-service.base-url:http://notification-service:8086}")
    private String notificationServiceBaseUrl;

    @Value("${clients.notification-service.mock-enabled:true}")
    private boolean mockEnabled;

    public void sendAppointmentNotification(NotificationRequest request) {
        if (mockEnabled) return;

        // Expected future endpoint (example):
        // POST /notifications/appointments
        webClient.post()
                .uri(notificationServiceBaseUrl + "/notifications/appointments")
                .bodyValue(request)
                .retrieve()
                .toBodilessEntity()
                .onErrorResume(e -> Mono.empty())
                .subscribe();
    }

    @Builder
    public record NotificationRequest(
            String type,
            String appointmentId,
            String patientId,
            String doctorId,
            LocalDate appointmentDate,
            String timeSlot,
            String message
    ) {}
}

