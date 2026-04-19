package com.healthcare.patient_service.controller;

import com.healthcare.patient_service.dto.ReportRequest;
import com.healthcare.patient_service.model.MedicalReport;
import com.healthcare.patient_service.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalReport> uploadMedicalReport(
            @PathVariable String patientId,
            @RequestParam("reportType") String reportType,
            @RequestParam("description") String description,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            MedicalReport report = reportService.uploadReport(patientId, reportType, description, file, currentUserId);
            return new ResponseEntity<>(report, HttpStatus.CREATED);
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{reportId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalReport> updateReport(
            @PathVariable String patientId,
            @PathVariable String reportId,
            @RequestParam("reportType") String reportType,
            @RequestParam("description") String description,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            MedicalReport report = reportService.updateReport(reportId, reportType, description, file, currentUserId);
            return ResponseEntity.ok(report);
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<List<MedicalReport>> getPatientReports(@PathVariable String patientId) {
        List<MedicalReport> reports = reportService.getPatientReports(patientId);
        return ResponseEntity.ok(reports);
    }
}
