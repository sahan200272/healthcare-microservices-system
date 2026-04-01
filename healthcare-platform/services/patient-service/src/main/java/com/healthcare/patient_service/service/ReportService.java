package com.healthcare.patient_service.service;

import com.healthcare.patient_service.dto.ReportRequest;
import com.healthcare.patient_service.exception.ResourceNotFoundException;
import com.healthcare.patient_service.model.MedicalReport;
import com.healthcare.patient_service.model.Patient;
import com.healthcare.patient_service.repository.PatientRepository;
import com.healthcare.patient_service.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final PatientRepository patientRepository;

    public MedicalReport uploadReport(String patientId, ReportRequest request, String currentUserId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        // Check ownership
        if (!patient.getUserId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("You cannot upload a report for someone else's profile");
        }

        MedicalReport report = new MedicalReport();
        report.setPatientId(patientId);
        report.setReportType(request.getReportType());
        report.setDescription(request.getDescription());
        report.setFileUrl(request.getFileUrl());
        
        return reportRepository.save(report);
    }

    public List<MedicalReport> getPatientReports(String patientId) {
        // Also verify the patient exists before fetching reports
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
        }
        return reportRepository.findByPatientId(patientId);
    }
}
