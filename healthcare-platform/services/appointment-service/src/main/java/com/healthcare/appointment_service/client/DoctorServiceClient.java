package com.healthcare.appointment_service.client;

import com.healthcare.appointment_service.exception.ForbiddenException;
import com.healthcare.appointment_service.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DoctorServiceClient {

    @Autowired
    private WebClient webClient;

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

    /**
     * Calls GET /api/doctors/user/{userId} on the Doctor Service.
     * Resolves the JWT userId → the doctor's MongoDB _id (doctorId).
     * The caller's JWT is forwarded so Doctor Service can authenticate the request.
     *
     * @throws NotFoundException  if no doctor profile exists for this userId
     * @throws ForbiddenException if Doctor Service rejects the token (403)
     * @throws RuntimeException   if Doctor Service is unreachable
     */
    public String getDoctorIdByUserId(String userId, String jwtToken) {
        log.info("Resolving doctorId for userId={} via Doctor Service", userId);
        try {
            DoctorProfileResponse profile = webClient.get()
                    .uri(doctorServiceBaseUrl + "/api/doctors/user/{userId}", userId)
                    .header("Authorization", "Bearer " + jwtToken)
                    .retrieve()
                    .bodyToMono(DoctorProfileResponse.class)
                    .block();

            if (profile == null || profile.doctorId() == null) {
                throw new NotFoundException("Doctor profile not found for userId: " + userId);
            }
            log.info("Resolved userId={} → doctorId={}", userId, profile.doctorId());
            return profile.doctorId();
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new NotFoundException("Doctor profile not found for userId: " + userId);
            }
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new ForbiddenException("Access denied when resolving doctor profile");
            }
            log.error("Doctor Service error resolving userId={}: status={}, body={}",
                    userId, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException("Doctor Service returned error: " + ex.getStatusCode());
        } catch (Exception ex) {
            log.error("Doctor Service unreachable when resolving userId={}: {}", userId, ex.getMessage());
            throw new RuntimeException("Doctor Service is not reachable: " + ex.getMessage());
        }
    }

    private record DoctorAvailabilityResponse(boolean available) {}

    private record DoctorProfileResponse(String doctorId) {}
}

