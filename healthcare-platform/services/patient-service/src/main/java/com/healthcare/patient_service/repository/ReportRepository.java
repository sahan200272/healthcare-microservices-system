package com.healthcare.patient_service.repository;

import com.healthcare.patient_service.model.MedicalReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends MongoRepository<MedicalReport, String> {
    List<MedicalReport> findByPatientId(String patientId);
}
