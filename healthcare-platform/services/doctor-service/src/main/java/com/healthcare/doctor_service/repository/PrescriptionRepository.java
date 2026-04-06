package com.healthcare.doctor_service.repository;

import com.healthcare.doctor_service.model.Prescription;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends MongoRepository<Prescription, String> {

    List<Prescription> findByDoctorId(String doctorId);

    List<Prescription> findByPatientId(String patientId);

    List<Prescription> findByAppointmentId(String appointmentId);
}
