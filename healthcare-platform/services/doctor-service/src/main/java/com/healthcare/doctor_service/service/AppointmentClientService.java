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
import org.springframework.web.client.HttpServerErrorException;
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
        confirmAppointmentOnService(appointmentId, jwtToken);

        return new AppointmentActionResponse(
                appointmentId,
                "ACCEPTED",
                "Appointment accepted successfully by doctor " + doctorId);
    }

    public AppointmentActionResponse rejectAppointment(String doctorId,
                                                       String appointmentId,
                                                       String jwtToken) {
        validateBeforeStatusChange(doctorId, appointmentId, jwtToken);
        rejectAppointmentOnService(appointmentId, jwtToken);

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
            log.error("Appointment Service returned client error: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Failed to fetch appointment: " + ex.getResponseBodyAsString());
        } catch (HttpServerErrorException ex) {
            log.error("Appointment Service returned server error: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Appointment Service error: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            log.error("Appointment Service is not reachable: {}", ex.getMessage());
            throw new BadRequestException("Appointment Service is not reachable.");
        }
    }

    /**
     * Calls PUT /api/appointments/{id}/accept on the Appointment Service.
     * The Appointment Service extracts doctorId from the forwarded JWT.
     */
    private void confirmAppointmentOnService(String appointmentId, String jwtToken) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(jwtToken));
        log.info("Accepting appointment on Appointment Service: PUT /api/appointments/{}/accept", appointmentId);
        try {
            appointmentRestTemplate.exchange(
                    "/api/appointments/{id}/accept",
                    HttpMethod.PUT,
                    entity,
                    Void.class,
                    appointmentId
            );
        } catch (HttpClientErrorException.NotFound ex) {
            throw new AppointmentNotFoundException("Appointment not found: " + appointmentId);
        } catch (HttpClientErrorException ex) {
            log.error("Appointment Service error on accept: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Failed to accept appointment: " + ex.getResponseBodyAsString());
        } catch (HttpServerErrorException ex) {
            log.error("Appointment Service server error on accept: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Appointment Service error on accept: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            log.error("Appointment Service unreachable on accept: {}", ex.getMessage());
            throw new BadRequestException("Appointment Service is not reachable.");
        }
    }

    /**
     * Calls PUT /api/appointments/{id}/reject on the Appointment Service.
     * Sets appointment status to REJECTED. Only callable by the owning doctor.
     */
    private void rejectAppointmentOnService(String appointmentId, String jwtToken) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(jwtToken));
        log.info("Rejecting appointment on Appointment Service: PUT /api/appointments/{}/reject", appointmentId);
        try {
            appointmentRestTemplate.exchange(
                    "/api/appointments/{id}/reject",
                    HttpMethod.PUT,
                    entity,
                    Void.class,
                    appointmentId
            );
        } catch (HttpClientErrorException.NotFound ex) {
            throw new AppointmentNotFoundException("Appointment not found: " + appointmentId);
        } catch (HttpClientErrorException ex) {
            log.error("Appointment Service error on reject: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Failed to reject appointment: " + ex.getResponseBodyAsString());
        } catch (HttpServerErrorException ex) {
            log.error("Appointment Service server error on reject: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Appointment Service error on reject: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            log.error("Appointment Service unreachable on reject: {}", ex.getMessage());
            throw new BadRequestException("Appointment Service is not reachable.");
        }
    }

    /**
     * Calls PUT /api/appointments/{id}/cancel on the Appointment Service.
     * Used when a patient cancels their own appointment.
     */
    private void cancelAppointmentOnService(String appointmentId, String jwtToken) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(jwtToken));
        log.info("Cancelling appointment on Appointment Service: PUT /api/appointments/{}/cancel", appointmentId);
        try {
            appointmentRestTemplate.exchange(
                    "/api/appointments/{id}/cancel",
                    HttpMethod.PUT,
                    entity,
                    Void.class,
                    appointmentId
            );
        } catch (HttpClientErrorException.NotFound ex) {
            throw new AppointmentNotFoundException("Appointment not found: " + appointmentId);
        } catch (HttpClientErrorException ex) {
            log.error("Appointment Service error on cancel: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Failed to cancel appointment: " + ex.getResponseBodyAsString());
        } catch (HttpServerErrorException ex) {
            log.error("Appointment Service server error on cancel: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BadRequestException("Appointment Service error on cancel: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            log.error("Appointment Service unreachable on cancel: {}", ex.getMessage());
            throw new BadRequestException("Appointment Service is not reachable.");
        }
    }

    private HttpHeaders buildHeaders(String jwtToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(jwtToken);
        return headers;
    }

    /**
     * Verifies the appointment belongs to the given doctor and returns the associated patientId.
     * Used by PatientReportService to fetch the correct patient's reports for a given appointment.
     *
     * [INTEGRATION POINT] Calls: GET /api/appointments/{appointmentId}
     *
     * @throws AppointmentNotFoundException if the appointment does not exist
     * @throws UnauthorizedDoctorException  if the appointment does not belong to this doctor
     * @throws BadRequestException          if patientId is missing or service is unreachable
     */
    public String getPatientIdForDoctorAppointment(String doctorId, String appointmentId, String jwtToken) {
        AppointmentDetailsResponse appointment = fetchAppointmentById(appointmentId, jwtToken);

        // NOTE: Appointment Service stores the patient's auth-service userId in patientId
        // (enforced at booking: patientId == JWT userId). This value is a userId, not Patient._id.
        log.info("Appointment {}: stored patientId (auth userId)={}", appointmentId, appointment.patientId());
        log.info("Appointment {}: stored doctorId={}, requesting doctorId={}",
                appointmentId, appointment.doctorId(), doctorId);

        if (!doctorId.equals(appointment.doctorId())) {
            throw new UnauthorizedDoctorException(
                    "Doctor " + doctorId + " is not authorized for appointment " + appointmentId);
        }

        if (appointment.patientId() == null || appointment.patientId().isBlank()) {
            throw new BadRequestException(
                    "Appointment " + appointmentId + " has no associated patient.");
        }

        return appointment.patientId();
    }

    record AppointmentDetailsResponse(String id, String doctorId, String patientId, String status) {}
}
