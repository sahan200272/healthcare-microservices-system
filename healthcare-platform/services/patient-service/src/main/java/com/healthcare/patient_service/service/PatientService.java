package com.healthcare.patient_service.service;

import com.healthcare.patient_service.dto.PatientRequest;
import com.healthcare.patient_service.dto.PatientResponse;
import com.healthcare.patient_service.exception.ResourceNotFoundException;
import com.healthcare.patient_service.model.Patient;
import com.healthcare.patient_service.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientResponse createPatient(PatientRequest request, String userId) {
        if (patientRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException("Patient profile already exists for this user");
        }

        Patient patient = new Patient();
        patient.setUserId(userId);
        mapRequestToPatient(request, patient);

        return mapToResponse(patientRepository.save(patient));
    }

    public PatientResponse getPatientById(String patientId) {
        return mapToResponse(findPatientById(patientId));
    }

    public PatientResponse getPatientByUserId(String userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with User ID: " + userId));
        return mapToResponse(patient);
    }

    public PatientResponse updatePatient(String patientId, PatientRequest request, String currentUserId) {
        Patient patient = findPatientById(patientId);

        if (!patient.getUserId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("You cannot update someone else's profile");
        }

        mapRequestToPatient(request, patient);
        return mapToResponse(patientRepository.save(patient));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Patient findPatientById(String patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));
    }

    private void mapRequestToPatient(PatientRequest request, Patient patient) {
        patient.setFullName(request.getFullName());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setPhone(request.getPhone());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setAddress(request.getAddress());
        patient.setEmergencyContact(request.getEmergencyContact());
    }

    private PatientResponse mapToResponse(Patient patient) {
        PatientResponse response = new PatientResponse();
        response.setPatientId(patient.getPatientId());
        response.setUserId(patient.getUserId());
        response.setFullName(patient.getFullName());
        response.setAge(patient.getAge());
        response.setGender(patient.getGender());
        response.setPhone(patient.getPhone());
        response.setBloodGroup(patient.getBloodGroup());
        response.setAddress(patient.getAddress());
        response.setEmergencyContact(patient.getEmergencyContact());
        response.setCreatedAt(patient.getCreatedAt());
        response.setUpdatedAt(patient.getUpdatedAt());
        return response;
    }
}
