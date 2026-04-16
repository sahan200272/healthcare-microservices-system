package com.healthcare.appointment_service.service;

import com.healthcare.appointment_service.dto.AppointmentRequest;
import com.healthcare.appointment_service.dto.AppointmentResponse;
import com.healthcare.appointment_service.dto.RescheduleAppointmentRequest;
import com.healthcare.appointment_service.client.DoctorServiceClient;
import com.healthcare.appointment_service.client.NotificationServiceClient;
import com.healthcare.appointment_service.exception.BadRequestException;
import com.healthcare.appointment_service.exception.ConflictException;
import com.healthcare.appointment_service.exception.ForbiddenException;
import com.healthcare.appointment_service.exception.NotFoundException;
import com.healthcare.appointment_service.model.Appointment;
import com.healthcare.appointment_service.model.AppointmentStatus;
import com.healthcare.appointment_service.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorServiceClient doctorServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    private static final Set<AppointmentStatus> DOUBLE_BOOKING_STATUSES =
            Set.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED);

    public AppointmentResponse createAppointment(AppointmentRequest request) {
        validateNotPast(request.getAppointmentDate(), request.getTimeSlot());

        boolean available = doctorServiceClient.isDoctorAvailable(
                request.getDoctorId(),
                request.getAppointmentDate(),
                request.getTimeSlot()
        );
        if (!available) {
            throw new ConflictException("Doctor is not available for the requested slot");
        }

        boolean conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
                request.getDoctorId(),
                request.getAppointmentDate(),
                request.getTimeSlot(),
                DOUBLE_BOOKING_STATUSES.stream().toList()
        );

        if (conflict) {
            throw new ConflictException("Doctor already has an appointment in this time slot");
        }

        boolean patientConflict = appointmentRepository.existsByPatientIdAndAppointmentDateAndTimeSlotAndStatusIn(
                request.getPatientId(),
                request.getAppointmentDate(),
                request.getTimeSlot(),
                DOUBLE_BOOKING_STATUSES.stream().toList()
        );
        if (patientConflict) {
            throw new ConflictException("Patient already has an appointment in this time slot");
        }

        Instant now = Instant.now();
        Appointment appointment = Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentDate(request.getAppointmentDate())
                .timeSlot(request.getTimeSlot())
                .reason(request.getReason())
                .status(AppointmentStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        notificationServiceClient.sendAppointmentNotification(
                NotificationServiceClient.NotificationRequest.builder()
                        .type("BOOKED")
                        .appointmentId(saved.getId())
                        .patientId(saved.getPatientId())
                        .doctorId(saved.getDoctorId())
                        .appointmentDate(saved.getAppointmentDate())
                        .timeSlot(saved.getTimeSlot())
                        .message("Appointment booked")
                        .build()
        );

        return toResponse(saved);
    }

    public AppointmentResponse getAppointmentById(String id) {
        return toResponse(findByIdOrThrow(id));
    }

    public List<AppointmentResponse> getPatientAppointments(String patientId) {
        return appointmentRepository.findByPatientId(patientId).stream().map(this::toResponse).toList();
    }

    public List<AppointmentResponse> getDoctorAppointments(String doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream().map(this::toResponse).toList();
    }

    /**
     * Accept a PENDING appointment.
     *
     * @param id       appointment MongoDB _id
     * @param userId   the JWT userId of the calling doctor (NOT the doctorId)
     * @param jwtToken raw Bearer token forwarded to Doctor Service for the lookup
     */
    public AppointmentResponse acceptAppointment(String id, String userId, String jwtToken) {
        Appointment appointment = findByIdOrThrow(id);

        // userId (JWT) ≠ doctorId (Doctor._id) — must resolve via Doctor Service
        String doctorId = doctorServiceClient.getDoctorIdByUserId(userId, jwtToken);

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new ForbiddenException("You cannot accept an appointment for another doctor");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Only PENDING appointments can be accepted");
        }

        appointment.setStatus(AppointmentStatus.ACCEPTED);
        appointment.setUpdatedAt(Instant.now());
        Appointment saved = appointmentRepository.save(appointment);

        notificationServiceClient.sendAppointmentNotification(
                NotificationServiceClient.NotificationRequest.builder()
                        .type("ACCEPTED")
                        .appointmentId(saved.getId())
                        .patientId(saved.getPatientId())
                        .doctorId(saved.getDoctorId())
                        .appointmentDate(saved.getAppointmentDate())
                        .timeSlot(saved.getTimeSlot())
                        .message("Appointment accepted by doctor")
                        .build()
        );

        return toResponse(saved);
    }

    public AppointmentResponse confirmAppointment(String id, String userId, String jwtToken) {
        Appointment appointment = findByIdOrThrow(id);

        String doctorId = doctorServiceClient.getDoctorIdByUserId(userId, jwtToken);

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new ForbiddenException("You cannot confirm an appointment for another doctor");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Only PENDING appointments can be confirmed");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setUpdatedAt(Instant.now());
        Appointment saved = appointmentRepository.save(appointment);

        notificationServiceClient.sendAppointmentNotification(
                NotificationServiceClient.NotificationRequest.builder()
                        .type("CONFIRMED")
                        .appointmentId(saved.getId())
                        .patientId(saved.getPatientId())
                        .doctorId(saved.getDoctorId())
                        .appointmentDate(saved.getAppointmentDate())
                        .timeSlot(saved.getTimeSlot())
                        .message("Appointment confirmed")
                        .build()
        );

        return toResponse(saved);
    }

    public AppointmentResponse cancelAppointment(String id, String patientId) {
        Appointment appointment = findByIdOrThrow(id);

        // Prevent cancelling someone else's appointment
        if (!appointment.getPatientId().equals(patientId)) {
            throw new ForbiddenException("Unauthorized to cancel this appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Appointment already cancelled");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Completed appointments cannot be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(Instant.now());
        Appointment saved = appointmentRepository.save(appointment);

        notificationServiceClient.sendAppointmentNotification(
                NotificationServiceClient.NotificationRequest.builder()
                        .type("CANCELLED")
                        .appointmentId(saved.getId())
                        .patientId(saved.getPatientId())
                        .doctorId(saved.getDoctorId())
                        .appointmentDate(saved.getAppointmentDate())
                        .timeSlot(saved.getTimeSlot())
                        .message("Appointment cancelled")
                        .build()
        );

        return toResponse(saved);
    }

    public AppointmentResponse rescheduleAppointment(String id, String patientId, RescheduleAppointmentRequest request) {
        Appointment appointment = findByIdOrThrow(id);

        if (!appointment.getPatientId().equals(patientId)) {
            throw new ForbiddenException("Unauthorized to reschedule this appointment");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Only PENDING appointments can be rescheduled");
        }

        LocalDate newDate = request.getAppointmentDate();
        String newTimeSlot = request.getTimeSlot();
        validateNotPast(newDate, newTimeSlot);

        boolean available = doctorServiceClient.isDoctorAvailable(appointment.getDoctorId(), newDate, newTimeSlot);
        if (!available) {
            throw new ConflictException("Doctor is not available for the requested slot");
        }

        boolean conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
                appointment.getDoctorId(),
                newDate,
                newTimeSlot,
                DOUBLE_BOOKING_STATUSES.stream().toList()
        );
        // Allow keeping same slot (no-op) without failing due to "conflict" with itself.
        if (conflict && !(appointment.getAppointmentDate().equals(newDate) && appointment.getTimeSlot().equals(newTimeSlot))) {
            throw new ConflictException("Doctor already has an appointment in this time slot");
        }

        boolean patientConflict = appointmentRepository.existsByPatientIdAndAppointmentDateAndTimeSlotAndStatusIn(
                appointment.getPatientId(),
                newDate,
                newTimeSlot,
                DOUBLE_BOOKING_STATUSES.stream().toList()
        );
        if (patientConflict && !(appointment.getAppointmentDate().equals(newDate) && appointment.getTimeSlot().equals(newTimeSlot))) {
            throw new ConflictException("Patient already has an appointment in this time slot");
        }

        appointment.setAppointmentDate(newDate);
        appointment.setTimeSlot(newTimeSlot);
        appointment.setUpdatedAt(Instant.now());
        Appointment saved = appointmentRepository.save(appointment);

        notificationServiceClient.sendAppointmentNotification(
                NotificationServiceClient.NotificationRequest.builder()
                        .type("RESCHEDULED")
                        .appointmentId(saved.getId())
                        .patientId(saved.getPatientId())
                        .doctorId(saved.getDoctorId())
                        .appointmentDate(saved.getAppointmentDate())
                        .timeSlot(saved.getTimeSlot())
                        .message("Appointment rescheduled")
                        .build()
        );

        return toResponse(saved);
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    private Appointment findByIdOrThrow(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found: " + id));
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatientId())
                .doctorId(a.getDoctorId())
                .appointmentDate(a.getAppointmentDate())
                .timeSlot(a.getTimeSlot())
                .status(a.getStatus())
                .reason(a.getReason())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private void validateNotPast(LocalDate date, String timeSlot) {
        if (date == null) throw new BadRequestException("appointmentDate is required");
        if (timeSlot == null || timeSlot.isBlank()) throw new BadRequestException("timeSlot is required");

        // Parse and validate slot format and ordering
        com.healthcare.appointment_service.util.TimeSlot ts =
                com.healthcare.appointment_service.util.TimeSlot.parse(timeSlot);

        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        if (date.isBefore(today)) {
            throw new BadRequestException("Appointment cannot be booked for past dates");
        }
        if (date.isEqual(today)) {
            LocalTime now = LocalTime.now(ZoneId.systemDefault());
            if (!ts.end().isAfter(now)) {
                throw new BadRequestException("Appointment cannot be booked for past time slots");
            }
        }
    }
}