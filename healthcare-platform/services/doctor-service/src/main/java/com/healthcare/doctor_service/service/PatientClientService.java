package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.MedicalReportResponse;
import com.healthcare.doctor_service.dto.PatientDetailsResponse;
import com.healthcare.doctor_service.exception.BadRequestException;
import com.healthcare.doctor_service.exception.ResourceNotFoundException;
import com.healthcare.doctor_service.model.Prescription;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Client service for communicating with the Patient Service via REST.
 *
 * Simulation mode (services.patient.simulate=true in .env):
 *   When the Patient Service is not running, set PATIENT_SIMULATE=true in .env
 *   to return mock patient data so Doctor Service can be demoed in isolation.
 */
@Service
@RequiredArgsConstructor
public class PatientClientService {

    private static final Logger log = LoggerFactory.getLogger(PatientClientService.class);

    private final WebClient patientWebClient;

    /**
     * When true, all patient calls return a simulated response.
     * Set via .env: PATIENT_SIMULATE=true
     */
    @Value("${services.patient.simulate:false}")
    private boolean simulateMode;

    /**
     * Fetches patient details from the Patient Service by patient ID.
     * [INTEGRATION POINT] Calls: GET /api/patients/{patientId}
     *
     * @param patientId  the Patient Service document ID
     * @param jwtToken   forwarded Bearer token for auth
     * @return           patient details
     * @throws ResourceNotFoundException if the patient is not found (404)
     * @throws BadRequestException       if the Patient Service is unavailable
     */
    public PatientDetailsResponse getPatientDetails(String patientId, String jwtToken) {
        if (simulateMode) {
            log.warn("PatientClientService is in SIMULATION mode. Returning mock data for patientId={}", patientId);
            return buildSimulatedPatient(patientId);
        }

        log.info("Fetching real patient data from Patient Service for patientId={}", patientId);
        try {
            return patientWebClient.get()
                    .uri("/api/patients/{patientId}", patientId)
                    .header("Authorization", "Bearer " + jwtToken)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> {
                        if (response.statusCode().value() == 404) {
                            return response.createException()
                                    .map(ex -> new ResourceNotFoundException(
                                            "Patient not found with id: " + patientId));
                        }
                        return response.createException()
                                .map(ex -> new BadRequestException("Patient Service error: " + ex.getMessage()));
                    })
                    .bodyToMono(PatientDetailsResponse.class)
                    .block();
        } catch (ResourceNotFoundException | BadRequestException ex) {
            throw ex;
        } catch (WebClientResponseException ex) {
            log.error("Patient Service returned HTTP error for patientId={}: {}", patientId, ex.getResponseBodyAsString());
            throw new BadRequestException(
                    "Patient Service returned error: " + ex.getResponseBodyAsString());
        } catch (WebClientException ex) {
            // Connection refused / service unavailable
            log.error("Patient Service is not reachable for patientId={}: {}", patientId, ex.getMessage());
            throw new BadRequestException(
                    "Patient Service is not reachable. Enable simulation mode or start the service.");
        }
    }

    /**
     * Fetches patient details by the Auth Service user ID.
     * [INTEGRATION POINT] Calls: GET /api/patients/by-user/{userId}
     */
    public PatientDetailsResponse getPatientByUserId(String userId, String jwtToken) {
        if (simulateMode) {
            PatientDetailsResponse mock = buildSimulatedPatient("sim-patient-" + userId);
            mock.setUserId(userId);
            return mock;
        }

        try {
            return patientWebClient.get()
                    .uri("/api/patients/by-user/{userId}", userId)
                    .header("Authorization", "Bearer " + jwtToken)
                    .retrieve()
                    .bodyToMono(PatientDetailsResponse.class)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new BadRequestException(
                    "Patient Service returned error: " + ex.getResponseBodyAsString());
        } catch (WebClientException ex) {
            throw new BadRequestException(
                    "Patient Service is not reachable. Enable simulation mode or start the service.");
        }
    }

    /**
     * Fetches all medical reports for a patient from the Patient Service.
     * [INTEGRATION POINT] Calls: GET /api/patients/{patientId}/reports
     *
     * @param patientId  the Patient Service document ID
     * @param jwtToken   forwarded Bearer token for auth
     * @return           list of medical reports (empty list in simulation mode)
     * @throws ResourceNotFoundException if the patient is not found (404)
     * @throws BadRequestException       if the Patient Service is unavailable
     */
    public List<MedicalReportResponse> getPatientReports(String patientId, String jwtToken) {
        if (simulateMode) {
            log.warn("PatientClientService is in SIMULATION mode. Returning empty report list for patientId={}", patientId);
            return List.of();
        }

        log.info("Fetching medical reports from Patient Service for patientId={}", patientId);
        try {
            return patientWebClient.get()
                    .uri("/api/patients/{patientId}/reports", patientId)
                    .header("Authorization", "Bearer " + jwtToken)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> {
                        if (response.statusCode().value() == 404) {
                            return response.createException()
                                    .map(ex -> new ResourceNotFoundException(
                                            "Patient not found with id: " + patientId));
                        }
                        return response.createException()
                                .map(ex -> new BadRequestException("Patient Service error: " + ex.getMessage()));
                    })
                    .bodyToFlux(MedicalReportResponse.class)
                    .collectList()
                    .block();
        } catch (ResourceNotFoundException | BadRequestException ex) {
            throw ex;
        } catch (WebClientResponseException ex) {
            log.error("Patient Service returned HTTP error fetching reports for patientId={}: {}",
                    patientId, ex.getResponseBodyAsString());
            throw new BadRequestException(
                    "Patient Service returned error: " + ex.getResponseBodyAsString());
        } catch (WebClientException ex) {
            log.error("Patient Service is not reachable while fetching reports for patientId={}: {}",
                    patientId, ex.getMessage());
            throw new BadRequestException(
                    "Patient Service is not reachable. Enable simulation mode or start the service.");
        }
    }

    /**
     * Mirrors a prescription saved in the Doctor Service into the Patient Service
     * so patients can see their prescriptions on the Patient profile page.
     *
     * [INTEGRATION POINT] Calls: POST /api/patients/{patientId}/prescriptions
     *
     * This is a best-effort call — if the Patient Service is unreachable, we log
     * a warning but do NOT roll back the prescription already saved in the Doctor DB.
     *
     * @param prescription the saved prescription document from the Doctor Service
     * @param doctorName   human-readable doctor name to display in the Patient UI
     * @param jwtToken     forwarded Bearer token (must have DOCTOR role)
     */
    public void mirrorPrescriptionToPatientService(
            Prescription prescription, String doctorName, String jwtToken) {

        if (simulateMode) {
            log.warn("[SIMULATE] Skipping prescription mirror to Patient Service for patientId={}",
                    prescription.getPatientId());
            return;
        }

        // Build the request body that matches patient-service's PrescriptionRequest
        Map<String, Object> body = new HashMap<>();
        body.put("doctorName", doctorName);
        body.put("diagnosis", prescription.getDiagnosis());
        body.put("notes", prescription.getNotes());

        // Flatten the structured medications list into simple "Name – Dosage (Frequency, Duration)" strings
        List<String> medicines = prescription.getMedications() == null ? List.of() :
                prescription.getMedications().stream()
                        .map(m -> m.getName() + " – " + m.getDosage() +
                                  " (" + m.getFrequency() + ", " + m.getDuration() + ")")
                        .collect(Collectors.toList());
        body.put("medicines", medicines);

        log.info("Mirroring prescription {} to Patient Service for patientId={}",
                prescription.getPrescriptionId(), prescription.getPatientId());
        try {
            patientWebClient.post()
                    .uri("/api/patients/{patientId}/prescriptions", prescription.getPatientId())
                    .header("Authorization", "Bearer " + jwtToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response ->
                            response.createException().map(ex -> new BadRequestException(
                                    "Patient Service rejected prescription mirror: " + ex.getMessage())))
                    .onStatus(HttpStatusCode::is5xxServerError, response ->
                            response.createException().map(ex -> new BadRequestException(
                                    "Patient Service error during prescription mirror: " + ex.getMessage())))
                    .bodyToMono(Void.class)
                    .block();
            log.info("Prescription mirrored successfully to Patient Service for patientId={}",
                    prescription.getPatientId());
        } catch (Exception ex) {
            // Best-effort: log and continue — do not fail the prescription issuance
            log.error("Failed to mirror prescription to Patient Service (patientId={}): {}",
                    prescription.getPatientId(), ex.getMessage());
        }
    }

    private PatientDetailsResponse buildSimulatedPatient(String patientId) {
        PatientDetailsResponse mock = new PatientDetailsResponse();
        mock.setPatientId(patientId);
        mock.setUserId("sim-user-001");
        mock.setFullName("[SIMULATED] John Patient");
        mock.setAge(35);
        mock.setGender("Male");
        mock.setPhone("0771234567");
        mock.setBloodGroup("O+");
        mock.setAddress("123 Health Street, Colombo");
        return mock;
    }
}
