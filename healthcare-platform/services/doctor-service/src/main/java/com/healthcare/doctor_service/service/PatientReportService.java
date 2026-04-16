package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.MedicalReportResponse;
import com.healthcare.doctor_service.dto.PatientDetailsResponse;
import com.healthcare.doctor_service.exception.UnauthorizedDoctorException;
import com.healthcare.doctor_service.model.Doctor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Orchestrates access to patient medical reports for doctors.
 *
 * Authorization rules enforced here:
 *  - The doctorId must map to an APPROVED doctor in the local DB.
 *  - For appointment-scoped access the appointment must belong to the requesting doctor
 *    (verified via Appointment Service).
 *
 * Data is fetched from the Patient Service via {@link PatientClientService}.
 * Doctor Service does NOT access the Patient DB directly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PatientReportService {

    private final DoctorService doctorService;
    private final PatientClientService patientClientService;
    private final AppointmentClientService appointmentClientService;

    /**
     * Returns all medical reports uploaded by the given patient.
     *
     * Authorization: requesting doctor must exist and be APPROVED.
     *
     * [INTEGRATION POINT] Delegates to Patient Service: GET /api/patients/{patientId}/reports
     *
     * @param doctorId  doctor making the request
     * @param patientId patient whose reports are requested
     * @param jwtToken  forwarded Bearer token
     * @return list of medical reports
     * @throws UnauthorizedDoctorException if the doctor is not APPROVED
     */
    public List<MedicalReportResponse> getPatientReports(String doctorId,
                                                         String patientId,
                                                         String jwtToken) {
        requireApprovedDoctor(doctorId);
        log.info("Doctor {} fetching reports for patient {}", doctorId, patientId);
        return patientClientService.getPatientReports(patientId, jwtToken);
    }

    /**
     * Returns all medical reports for the patient associated with the given appointment.
     *
     * Authorization:
     *  - Requesting doctor must exist and be APPROVED.
     *  - The appointment must belong to this doctor (verified via Appointment Service).
     *
     * [INTEGRATION POINT] Appointment Service: GET /api/appointments/{appointmentId}
     * [INTEGRATION POINT] Patient Service:     GET /api/patients/user/{userId}   (userId → _id resolution)
     * [INTEGRATION POINT] Patient Service:     GET /api/patients/{patientId}/reports
     *
     * @param doctorId      doctor making the request
     * @param appointmentId appointment whose patient's reports are requested
     * @param jwtToken      forwarded Bearer token
     * @return list of medical reports
     * @throws UnauthorizedDoctorException  if the doctor is not APPROVED or does not own the appointment
     */
    public List<MedicalReportResponse> getReportsByAppointment(String doctorId,
                                                                String appointmentId,
                                                                String jwtToken) {
        requireApprovedDoctor(doctorId);

        // Step 1: Fetch appointment and verify doctor ownership.
        // The Appointment Service stores the patient's auth-service userId in its patientId field
        // (enforced at booking time: patientId == JWT userId). This is NOT the Patient MongoDB _id.
        String patientUserId = appointmentClientService.getPatientIdForDoctorAppointment(
                doctorId, appointmentId, jwtToken);

        log.info("Appointment {}: patientUserId (auth userId) = {}", appointmentId, patientUserId);

        // Step 2: Resolve auth userId → Patient MongoDB _id via Patient Service.
        // GET /api/patients/user/{userId} returns the patient profile including the real _id.
        PatientDetailsResponse patient = patientClientService.getPatientByUserId(patientUserId, jwtToken);
        String patientId = patient.getPatientId();

        log.info("Resolved patientUserId={} → patientId (MongoDB _id)={}", patientUserId, patientId);

        // Step 3: Fetch reports using the correct MongoDB _id.
        // GET /api/patients/{patientId}/reports expects the patient's MongoDB _id, not userId.
        log.info("Doctor {} fetching reports via appointment {} (patientId={})",
                doctorId, appointmentId, patientId);
        return patientClientService.getPatientReports(patientId, jwtToken);
    }

    private void requireApprovedDoctor(String doctorId) {
        Doctor doctor = doctorService.findDoctorOrThrow(doctorId);
        if (doctor.getVerificationStatus() != Doctor.VerificationStatus.APPROVED) {
            throw new UnauthorizedDoctorException(
                    "Doctor " + doctorId + " is not approved and cannot access patient reports.");
        }
    }
}
