package com.healthcare.patient_service.service;

import com.healthcare.patient_service.dto.MedicalHistoryRequest;
import com.healthcare.patient_service.dto.MedicalHistoryResponse;
import com.healthcare.patient_service.exception.ResourceNotFoundException;
import com.healthcare.patient_service.model.MedicalHistory;
import com.healthcare.patient_service.model.Patient;
import com.healthcare.patient_service.repository.MedicalHistoryRepository;
import com.healthcare.patient_service.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private final MedicalHistoryRepository medicalHistoryRepository;
    private final PatientRepository patientRepository;

    // PATIENT adds their own medical history entry
    public MedicalHistoryResponse addMedicalHistory(String patientId, MedicalHistoryRequest request, String currentUserId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        // Ownership check — only the patient themselves can add
        if (!patient.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You cannot modify someone else's medical history");
        }

        MedicalHistory history = new MedicalHistory();
        history.setPatientId(patientId);
        history.setCondition(request.getCondition());
        history.setDiagnosedDate(request.getDiagnosedDate());
        history.setTreatment(request.getTreatment());
        history.setNotes(request.getNotes());

        MedicalHistory saved = medicalHistoryRepository.save(history);
        return mapToResponse(saved);
    }

    // Any authenticated user (DOCTOR, PATIENT, ADMIN) can view medical history
    public List<MedicalHistoryResponse> getMedicalHistory(String patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
        }
        return medicalHistoryRepository.findByPatientId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private MedicalHistoryResponse mapToResponse(MedicalHistory h) {
        MedicalHistoryResponse response = new MedicalHistoryResponse();
        response.setHistoryId(h.getHistoryId());
        response.setPatientId(h.getPatientId());
        response.setCondition(h.getCondition());
        response.setDiagnosedDate(h.getDiagnosedDate());
        response.setTreatment(h.getTreatment());
        response.setNotes(h.getNotes());
        response.setRecordedAt(h.getRecordedAt());
        return response;
    }
}
