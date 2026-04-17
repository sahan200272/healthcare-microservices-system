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

    /**
     * Checks whether a time slot is available in the Doctor Service.
     *
     * <p><b>Format fix:</b> The Appointment Service stores slots as {@code "HH:mm-HH:mm"} ranges
     * (e.g. {@code "09:00-09:30"}), but the Doctor Service's {@code timeSlots} array holds only
     * the bare start-time (e.g. {@code "09:00"}).  We extract the start portion here so the
     * comparison in the Doctor Service will always match.
     *
     * @param doctorId the doctor's MongoDB _id
     * @param date     the appointment date
     * @param timeSlot the full range string, e.g. {@code "09:00-09:30"}
     * @return {@code true} if the slot is listed and not yet booked
     */
    public boolean isDoctorAvailable(String doctorId, LocalDate date, String timeSlot) {
        // Extract just the start-time (HH:mm) from "HH:mm-HH:mm" so it matches
        // how timeSlots are stored in the Doctor Service availability documents.
        String startTime = extractStartTime(timeSlot);

        log.debug("[DoctorServiceClient] Checking availability: doctorId={} date={} startTime={}",
                doctorId, date, startTime);
        try {
            DoctorAvailabilityResponse resp = webClient.get()
                    .uri(doctorServiceBaseUrl
                                    + "/api/doctors/{doctorId}/availability/check?date={date}&timeSlot={slot}",
                            doctorId, date, startTime)
                    .retrieve()
                    .bodyToMono(DoctorAvailabilityResponse.class)
                    .blockOptional()
                    .orElse(new DoctorAvailabilityResponse(false));

            log.debug("[DoctorServiceClient] Availability response: {}", resp.available());
            return resp.available();
        } catch (Exception ex) {
            log.warn("[DoctorServiceClient] isDoctorAvailable call failed (doctorId={} date={} slot={}): {}",
                    doctorId, date, startTime, ex.getMessage());
            // Fail open only if the service is completely unreachable;
            // for a production system consider failing closed (return false).
            return false;
        }
    }

    /**
     * Marks a time slot as booked in the Doctor Service using the atomic {@code $addToSet} endpoint.
     *
     * <p>Called AFTER the appointment has been persisted, so the appointment record always exists
     * before the availability is updated.  If this call fails (e.g. doctor-service is down) the
     * appointment is still created; a compensating mechanism (retry / event) should be used in
     * production for full consistency.
     *
     * @param doctorId the doctor's MongoDB _id
     * @param date     the appointment date
     * @param timeSlot the full range string, e.g. {@code "09:00-09:30"}
     */
    public void markSlotBooked(String doctorId, LocalDate date, String timeSlot) {
        String startTime = extractStartTime(timeSlot);
        log.info("[DoctorServiceClient] Marking slot as booked: doctorId={} date={} startTime={}",
                doctorId, date, startTime);
        try {
            webClient.post()
                    .uri(doctorServiceBaseUrl
                                    + "/api/doctors/{doctorId}/availability/book?date={date}&timeSlot={slot}",
                            doctorId, date, startTime)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("[DoctorServiceClient] Slot successfully marked as booked.");
        } catch (Exception ex) {
            // Log and continue — appointment is already persisted.
            // In production, emit an event / schedule a retry instead.
            log.error("[DoctorServiceClient] Failed to mark slot as booked (doctorId={} date={} slot={}): {}",
                    doctorId, date, startTime, ex.getMessage());
        }
    }

    /**
     * Calls GET /api/doctors/user/{userId} on the Doctor Service.
     * Resolves the JWT userId → the doctor's MongoDB _id (doctorId).
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

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Extracts the start portion of a {@code "HH:mm-HH:mm"} range string.
     *
     * <p>If the input is already a bare {@code "HH:mm"} (no dash), it is returned as-is,
     * so this method is safe to call regardless of format.
     *
     * @param timeSlot e.g. {@code "09:00-09:30"} or {@code "09:00"}
     * @return e.g. {@code "09:00"}
     */
    private String extractStartTime(String timeSlot) {
        if (timeSlot == null) return "";
        int dashIdx = timeSlot.indexOf('-');
        return dashIdx > 0 ? timeSlot.substring(0, dashIdx).trim() : timeSlot.trim();
    }

    // ── Response records ───────────────────────────────────────────────────

    private record DoctorAvailabilityResponse(boolean available) {}

    private record DoctorProfileResponse(String doctorId) {}
}
