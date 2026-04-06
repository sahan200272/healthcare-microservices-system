//healthcare-microservices-system/healthcare/services/appointment-service/src/main/java/com.healthcare.appointment_service/service/AppointmentService

package com.healthcare.appointment_service.service;

import com.healthcare.appointment_service.dto.AppointmentRequest;
import com.healthcare.appointment_service.model.Appointment;
import com.healthcare.appointment_service.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public Appointment bookAppointment(AppointmentRequest request) {

        if (request.getPatientId() == null || request.getDoctorId() == null) {
            throw new RuntimeException("Patient ID and Doctor ID are required");
        }

        // Prevent booking in the past
        if (request.getAppointmentDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book appointment in the past");
        }

        // Prevent duplicate booking (same doctor & time)
        List<Appointment> existingAppointments =
                appointmentRepository.findByDoctorId(request.getDoctorId());

        boolean conflict = existingAppointments.stream()
                .anyMatch(a -> a.getAppointmentDate().equals(request.getAppointmentDate())
                        && a.getStatus().equals("BOOKED"));

        if (conflict) {
            throw new RuntimeException("Doctor already has an appointment at this time");
        }

        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStatus("BOOKED");
        appointment.setCreatedAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    public Appointment getAppointmentById(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found: " + id));
    }

    public List<Appointment> getPatientAppointments(String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getDoctorAppointments(String doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment cancelAppointment(String id, String patientId) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Prevent cancelling someone else's appointment
        if (!appointment.getPatientId().equals(patientId)) {
            throw new RuntimeException("Unauthorized to cancel this appointment");
        }

        // Prevent cancelling already cancelled appointment
        if ("CANCELLED".equals(appointment.getStatus())) {
            throw new RuntimeException("Appointment already cancelled");
        }

        appointment.setStatus("CANCELLED");
        return appointmentRepository.save(appointment);
    }
}