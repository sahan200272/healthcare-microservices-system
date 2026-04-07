package com.healthcare.patient_service.service;

import com.healthcare.patient_service.dto.PrescriptionRequest;
import com.healthcare.patient_service.dto.PrescriptionResponse;
import com.healthcare.patient_service.exception.ResourceNotFoundException;
import com.healthcare.patient_service.model.Prescription;
import com.healthcare.patient_service.repository.PatientRepository;
import com.healthcare.patient_service.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;

    // DOCTOR or ADMIN can add a prescription for a patient
    public PrescriptionResponse addPrescription(String patientId, PrescriptionRequest request) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
        }

        Prescription prescription = new Prescription();
        prescription.setPatientId(patientId);
        prescription.setDoctorName(request.getDoctorName());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedicines(request.getMedicines());
        prescription.setNotes(request.getNotes());

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToResponse(saved);
    }

    // PATIENT views their own prescriptions
    public List<PrescriptionResponse> getPrescriptionsByPatientId(String patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
        }
        return prescriptionRepository.findByPatientId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PrescriptionResponse mapToResponse(Prescription p) {
        PrescriptionResponse response = new PrescriptionResponse();
        response.setPrescriptionId(p.getPrescriptionId());
        response.setPatientId(p.getPatientId());
        response.setDoctorName(p.getDoctorName());
        response.setDiagnosis(p.getDiagnosis());
        response.setMedicines(p.getMedicines());
        response.setNotes(p.getNotes());
        response.setPrescribedAt(p.getPrescribedAt());
        return response;
    }
}
