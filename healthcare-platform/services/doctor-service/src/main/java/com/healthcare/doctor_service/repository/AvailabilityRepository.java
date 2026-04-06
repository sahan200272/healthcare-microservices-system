package com.healthcare.doctor_service.repository;

import com.healthcare.doctor_service.model.Availability;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityRepository extends MongoRepository<Availability, String> {

    List<Availability> findByDoctorIdAndActiveTrue(String doctorId);

    Optional<Availability> findByDoctorIdAndAvailableDate(String doctorId, LocalDate date);

    List<Availability> findByDoctorIdAndAvailableDateGreaterThanEqualAndActiveTrue(
            String doctorId, LocalDate fromDate);
}
