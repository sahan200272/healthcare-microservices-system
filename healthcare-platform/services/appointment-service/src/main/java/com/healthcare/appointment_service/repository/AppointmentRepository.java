//healthcare-microservices-system/healthcare/services/appointment-service/src/main/java/com.healthcare.appointment_service/repository/AppointmentRepository

package com.healthcare.appointment_service.repository;

import com.healthcare.appointment_service.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    List<Appointment> findByPatientId(String patientId);

    List<Appointment> findByDoctorId(String doctorId);
}