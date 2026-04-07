package com.healthcare.patient_service.repository;

import com.healthcare.patient_service.model.MedicalHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalHistoryRepository extends MongoRepository<MedicalHistory, String> {
    List<MedicalHistory> findByPatientId(String patientId);
}
