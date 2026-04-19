package com.healthcare.appointment_service.repository;

import com.healthcare.appointment_service.model.Appointment;
import com.healthcare.appointment_service.model.AppointmentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    List<Appointment> findByPatientId(String patientId);

    List<Appointment> findByDoctorId(String doctorId);

    boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
            String doctorId,
            LocalDate appointmentDate,
            String timeSlot,
            List<AppointmentStatus> statuses
    );

    boolean existsByPatientIdAndAppointmentDateAndTimeSlotAndStatusIn(
            String patientId,
            LocalDate appointmentDate,
            String timeSlot,
            List<AppointmentStatus> statuses
    );
}