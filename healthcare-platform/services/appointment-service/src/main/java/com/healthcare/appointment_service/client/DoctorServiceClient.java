package com.healthcare.appointment_service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DoctorServiceClient {
    private final WebClient webClient;

    @Value("${clients.doctor-service.base-url:http://doctor-service:8083}")
    private String doctorServiceBaseUrl;

    @Value("${clients.doctor-service.mock-enabled:true}")
    private boolean mockEnabled;

    /**
     * Mocked availability check (can be wired to real Doctor Service later).
     */
    public boolean isDoctorAvailable(String doctorId, LocalDate date, String timeSlot) {
        if (mockEnabled) return true;

        // Expected future endpoint (example):
        // GET /doctors/{doctorId}/availability?date=YYYY-MM-DD&timeSlot=HH:mm-HH:mm -> { "available": true }
        return webClient.get()
                .uri(doctorServiceBaseUrl + "/doctors/{doctorId}/availability?date={date}&timeSlot={timeSlot}",
                        doctorId, date, timeSlot)
                .retrieve()
                .bodyToMono(DoctorAvailabilityResponse.class)
                .map(DoctorAvailabilityResponse::available)
                .onErrorReturn(false)
                .blockOptional()
                .orElse(false);
    }

    private record DoctorAvailabilityResponse(boolean available) {}
}

