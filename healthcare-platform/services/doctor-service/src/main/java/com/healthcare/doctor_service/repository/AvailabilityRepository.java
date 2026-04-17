package com.healthcare.doctor_service.repository;

import com.healthcare.doctor_service.model.Availability;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
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

    /**
     * Atomically pushes {@code slot} into {@code bookedSlots} using MongoDB {@code $addToSet}.
     * This is idempotent and safe under concurrent writes — the same slot can never appear twice.
     *
     * @param availabilityId the {@code _id} of the availability document
     * @param slot           the bare HH:mm start-time to mark as booked, e.g. {@code "09:00"}
     */
    @Query("{ '_id': ?0 }")
    @Update("{ '$addToSet': { 'bookedSlots': ?1 } }")
    void addToBookedSlots(String availabilityId, String slot);
}
