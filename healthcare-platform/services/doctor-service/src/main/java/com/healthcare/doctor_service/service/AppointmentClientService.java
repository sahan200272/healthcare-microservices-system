package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.AppointmentActionResponse;
import com.healthcare.doctor_service.exception.AppointmentNotFoundException;
import com.healthcare.doctor_service.exception.BadRequestException;
import com.healthcare.doctor_service.exception.UnauthorizedDoctorException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentClientService {

    private static final String PENDING_STATUS = "PENDING";

    private final RestTemplate appointmentRestTemplate;

    /**
     * Validates that an appointment exists in the Appointment Service.
     * [INTEGRATION POINT] Calls: GET /api/appointments/{appointmentId}
     *
     * @throws AppointmentNotFoundException if the appointment does not exist (404)
     * @throws BadRequestException          if the Appointment Service is unreachable
     */
    public void validateAppointmentExists(String appointmentId, String jwtToken) {
        fetchAppointmentById(appointmentId, jwtToken);
    }

    public AppointmentActionResponse acceptAppointment(String doctorId,
                                                       String appointmentId,
                                                       String jwtToken) {
        validateBeforeStatusChange(doctorId, appointmentId, jwtToken);
        updateAppointmentStatus(doctorId, appointmentId, jwtToken, "ACCEPTED");

        return new AppointmentActionResponse(
                appointmentId,
                "ACCEPTED",
                "Appointment accepted successfully by doctor " + doctorId);
    }

    public AppointmentActionResponse rejectAppointment(String doctorId,
                                                       String appointmentId,
                                                       String jwtToken) {
        validateBeforeStatusChange(doctorId, appointmentId, jwtToken);
        updateAppointmentStatus(doctorId, appointmentId, jwtToken, "REJECTED");

        return new AppointmentActionResponse(
                appointmentId,
                "REJECTED",
                "Appointment rejected by doctor " + doctorId);
    }

    private void validateBeforeStatusChange(String doctorId, String appointmentId, String jwtToken) {
        AppointmentDetailsResponse appointment = fetchAppointmentById(appointmentId, jwtToken);

        if (appointment == null) {
            throw new AppointmentNotFoundException("Appointment not found: " + appointmentId);
        }

        if (!doctorId.equals(appointment.doctorId())) {
            throw new UnauthorizedDoctorException(
                    "Doctor " + doctorId + " is not authorized for appointment " + appointmentId);
        }

        if (!PENDING_STATUS.equalsIgnoreCase(appointment.status())) {
            throw new BadRequestException(
                    "Appointment status must be PENDING to process this action. Current status: "
                            + appointment.status());
        }
    }

    private AppointmentDetailsResponse fetchAppointmentById(String appointmentId, String jwtToken) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(jwtToken));

        log.info("Fetching appointment from Appointment Service: GET /api/appointments/{}", appointmentId);
        try {
            ResponseEntity<AppointmentDetailsResponse> response = appointmentRestTemplate.exchange(
                    "/api/appointments/{id}",
                    HttpMethod.GET,
                    entity,
                    AppointmentDetailsResponse.class,
                    appointmentId
            );
            log.info("Appointment fetch succeeded: status={}, body={}", response.getStatusCode(), response.getBody());
            return response.getBody();
        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("Appointment not found (404): appointmentId={}", appointmentId);
            throw new AppointmentNotFoundException("Appointment not found: " + appointmentId);
        } catch (HttpClientErrorException ex) {
            log.error("Appointment Service returned error: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Failed to fetch appointment: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            log.error("Appointment Service is not reachable: {}", ex.getMessage());
            throw new BadRequestException("Appointment Service is not reachable.");
        }
    }

    private void updateAppointmentStatus(String doctorId,
                                         String appointmentId,
                                         String jwtToken,
                                         String status) {
        HttpEntity<AppointmentStatusUpdateRequest> entity = new HttpEntity<>(
                new AppointmentStatusUpdateRequest(doctorId, status),
                buildHeaders(jwtToken)
        );

        try {
            appointmentRestTemplate.exchange(
                    "/api/appointments/{id}/status",
                    HttpMethod.PUT,
                    entity,
                    Void.class,
                    appointmentId
            );
        } catch (HttpClientErrorException.NotFound ex) {
            throw new AppointmentNotFoundException("Appointment not found: " + appointmentId);
        } catch (HttpClientErrorException ex) {
            throw new BadRequestException("Failed to update appointment status: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            throw new BadRequestException("Appointment Service is not reachable.");
        }
    }

    private HttpHeaders buildHeaders(String jwtToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(jwtToken);
        return headers;
    }

    record AppointmentDetailsResponse(String id, String doctorId, String status) {}

    record AppointmentStatusUpdateRequest(String doctorId, String status) {}
}
