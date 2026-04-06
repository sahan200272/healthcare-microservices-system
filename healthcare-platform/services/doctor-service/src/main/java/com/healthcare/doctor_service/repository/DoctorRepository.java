package com.healthcare.doctor_service.repository;

import com.healthcare.doctor_service.model.Doctor;
import com.healthcare.doctor_service.model.Doctor.VerificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {

    Optional<Doctor> findByUserId(String userId);

    Optional<Doctor> findByEmail(String email);

    Optional<Doctor> findByLicenseNumber(String licenseNumber);

    List<Doctor> findBySpecialization(String specialization);

    List<Doctor> findByVerificationStatus(VerificationStatus status);

    boolean existsByEmail(String email);

    boolean existsByLicenseNumber(String licenseNumber);
}
