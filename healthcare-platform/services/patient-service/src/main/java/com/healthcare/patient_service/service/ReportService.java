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

    public MedicalReport uploadReport(String patientId, String reportType, String description, org.springframework.web.multipart.MultipartFile file, String currentUserId) throws java.io.IOException {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        // Check ownership
        if (!patient.getUserId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("You cannot upload a report for someone else's profile");
        }

        MedicalReport report = new MedicalReport();
        report.setPatientId(patientId);
        report.setReportType(reportType);
        report.setDescription(description);
        
        if (file != null && !file.isEmpty()) {
            String uploadDir = "uploads/";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String fileName = java.util.UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            report.setFileUrl(filePath.toString());
        }
        
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
