package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.PrescriptionRequest;
import com.healthcare.doctor_service.dto.PrescriptionResponse;
import com.healthcare.doctor_service.model.Prescription;
import com.healthcare.doctor_service.model.Prescription.Medication;
import com.healthcare.doctor_service.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DoctorService doctorService;
    private final PatientClientService patientClientService;
    private final AppointmentClientService appointmentClientService;

    public PrescriptionResponse issuePrescription(String doctorId, PrescriptionRequest request, String jwtToken) {
        String patientId = request.getPatientId();
        log.info("Using patientId: {}", patientId);
        
        if (!ObjectId.isValid(patientId)) {
            throw new IllegalArgumentException("Invalid patientId");
        }

        // Ensure doctor exists and is verified
        var doctor = doctorService.findDoctorOrThrow(doctorId);
        if (!doctor.isVerified()) {
            throw new com.healthcare.doctor_service.exception.BadRequestException(
                    "Only verified doctors can issue prescriptions.");
        }

        // Validate patient exists in Patient Service
        log.info("Validating patient existence for patientId: {}", request.getPatientId());
        try {
            patientClientService.getPatientDetails(request.getPatientId(), jwtToken);
        } catch (com.healthcare.doctor_service.exception.ResourceNotFoundException ex) {
            log.warn("Prescription rejected — patient not found: {}", request.getPatientId());
            throw ex;
        } catch (com.healthcare.doctor_service.exception.BadRequestException ex) {
            log.warn("Prescription rejected — Patient Service error for patientId {}: {}",
                    request.getPatientId(), ex.getMessage());
            throw ex;
        }

        // Validate appointment exists in Appointment Service
        log.info("Validating appointment existence for appointmentId: {}", request.getAppointmentId());
        try {
            appointmentClientService.validateAppointmentExists(request.getAppointmentId(), jwtToken);
        } catch (com.healthcare.doctor_service.exception.AppointmentNotFoundException ex) {
            log.warn("Prescription rejected — appointment not found: {}", request.getAppointmentId());
            throw ex;
        } catch (com.healthcare.doctor_service.exception.BadRequestException ex) {
            log.warn("Prescription rejected — Appointment Service error for appointmentId {}: {}",
                    request.getAppointmentId(), ex.getMessage());
            throw ex;
        }

        Prescription prescription = new Prescription();
        prescription.setDoctorId(doctorId);
        prescription.setPatientId(request.getPatientId());
        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        prescription.setMedications(
                request.getMedications().stream()
                        .map(this::toMedication)
                        .collect(Collectors.toList())
        );

        Prescription saved = prescriptionRepository.save(prescription);
        return toResponse(saved);
    }

    public List<PrescriptionResponse> getPrescriptionsByDoctor(String doctorId) {
        doctorService.findDoctorOrThrow(doctorId);
        return prescriptionRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Medication toMedication(PrescriptionRequest.MedicationRequest req) {
        Medication med = new Medication();
        med.setName(req.getName());
        med.setDosage(req.getDosage());
        med.setFrequency(req.getFrequency());
        med.setDuration(req.getDuration());
        med.setInstructions(req.getInstructions());
        return med;
    }

    private PrescriptionResponse toResponse(Prescription prescription) {
        PrescriptionResponse response = new PrescriptionResponse();
        response.setPrescriptionId(prescription.getPrescriptionId());
        response.setDoctorId(prescription.getDoctorId());
        response.setPatientId(prescription.getPatientId());
        response.setAppointmentId(prescription.getAppointmentId());
        response.setDiagnosis(prescription.getDiagnosis());
        response.setNotes(prescription.getNotes());
        response.setIssuedAt(prescription.getIssuedAt());

        if (prescription.getMedications() != null) {
            response.setMedications(
                    prescription.getMedications().stream()
                            .map(m -> {
                                PrescriptionResponse.MedicationResponse mr = new PrescriptionResponse.MedicationResponse();
                                mr.setName(m.getName());
                                mr.setDosage(m.getDosage());
                                mr.setFrequency(m.getFrequency());
                                mr.setDuration(m.getDuration());
                                mr.setInstructions(m.getInstructions());
                                return mr;
                            })
                            .collect(Collectors.toList())
            );
        }

        return response;
    }
}
