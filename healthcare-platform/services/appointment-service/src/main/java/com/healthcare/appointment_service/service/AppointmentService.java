package com.healthcare.appointment_service.service;

import com.healthcare.appointment_service.dto.AppointmentRequest;
import com.healthcare.appointment_service.dto.AppointmentResponse;
import com.healthcare.appointment_service.dto.RescheduleAppointmentRequest;
import com.healthcare.appointment_service.client.DoctorServiceClient;
import com.healthcare.appointment_service.client.NotificationServiceClient;
import com.healthcare.appointment_service.client.TelemedicineServiceClient;
import com.healthcare.appointment_service.exception.BadRequestException;
import com.healthcare.appointment_service.exception.ConflictException;
import com.healthcare.appointment_service.exception.ForbiddenException;
import com.healthcare.appointment_service.exception.NotFoundException;
import com.healthcare.appointment_service.model.Appointment;
import com.healthcare.appointment_service.model.AppointmentStatus;
import com.healthcare.appointment_service.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorServiceClient doctorServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final TelemedicineServiceClient telemedicineServiceClient;

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
                .consultationType(request.getConsultationType() != null ? request.getConsultationType() : "IN_PERSON")
                .status(AppointmentStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("✅ [AppointmentService] Appointment saved to DB with ID: {}", saved.getId());
        log.info("   Consultation Type (raw): '{}'", saved.getConsultationType());
        log.info("   Consultation Type (length): {}", saved.getConsultationType() != null ? saved.getConsultationType().length() : "null");

        // Create video session if this is a video consultation (case-insensitive)
        if ("VIDEO_CONSULTATION".equalsIgnoreCase(saved.getConsultationType())) {
            log.info("✅ [AppointmentService] CONDITION MATCHED: Creating video session for video consultation appointment");
            log.info("   Appointment ID: {}", saved.getId());
            log.info("   Patient ID: {}", saved.getPatientId());
            log.info("   Doctor ID: {}", saved.getDoctorId());
            
            TelemedicineServiceClient.VideoSessionResponse sessionResponse = null;
            try {
                log.info("   [BEFORE] Calling telemedicineServiceClient.createVideoSession()...");
                sessionResponse = telemedicineServiceClient.createVideoSession(
                        saved.getId(),
                        saved.getPatientId(),
                        saved.getDoctorId()
                );
                log.info("   [AFTER] Returned from telemedicineServiceClient.createVideoSession()");
            } catch (Exception ex) {
                log.error("❌ [AppointmentService] EXCEPTION while calling telemedicineServiceClient: {}", ex.getMessage());
                log.error("   Exception Type: {}", ex.getClass().getName());
                log.error("   Stack Trace: ", ex);
                sessionResponse = null;
            }
            
            log.info("   [CHECK] sessionResponse is null: {}", sessionResponse == null);
            if (sessionResponse != null) {
                log.info("   [CHECK] sessionResponse.getId(): '{}'", sessionResponse.getId());
                log.info("   [CHECK] sessionResponse.getId() is null: {}", sessionResponse.getId() == null);
            }
            
            if (sessionResponse != null && sessionResponse.getId() != null) {
                log.info("✅ [AppointmentService] Video session created - linking to appointment");
                saved.setVideoSessionId(sessionResponse.getId());
                try {
                    Appointment updated = appointmentRepository.save(saved);
                    log.info("✅ [AppointmentService] Appointment updated with videoSessionId: {}", updated.getVideoSessionId());
                    log.info("   Room Name: {}", sessionResponse.getRoomName());
                    log.info("   Meeting URL: {}", sessionResponse.getMeetingUrl());
                } catch (Exception ex) {
                    log.error("❌ [AppointmentService] Failed to save appointment with videoSessionId: {}", ex.getMessage(), ex);
                }
            } else if (sessionResponse == null) {
                log.warn("⚠️  [AppointmentService] sessionResponse is NULL - video session creation failed completely");
            } else {
                log.warn("⚠️  [AppointmentService] sessionResponse.getId() is NULL - sessionResponse exists but has no ID");
                log.warn("   Full Response: {}", sessionResponse);
            }
        } else {
            log.info("ℹ️ [AppointmentService] CONDITION NOT MATCHED: Appointment type is '{}' (expected 'VIDEO_CONSULTATION'), skipping video session creation", saved.getConsultationType());
        }

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
        log.debug("🔍 Querying appointments for patientId: {}", patientId);
        
        try {
            // Guard against null repository (should not happen with Spring DI)
            if (appointmentRepository == null) {
                log.error("❌ appointmentRepository is null");
                return Collections.emptyList();
            }
            
            // Query the database
            List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
            
            // Guard against null result (unlikely with Spring Data, but be safe)
            if (appointments == null) {
                log.warn("⚠️  appointmentRepository.findByPatientId() returned null for patientId: {}", patientId);
                return Collections.emptyList();
            }
            
            log.debug("✅ Found {} appointments for patientId: {}", appointments.size(), patientId);
            
            // Map to response objects
            List<AppointmentResponse> responses = appointments.stream()
                    .map(this::toResponse)
                    .toList();
            
            log.info("✅ Converted {} appointments to responses", responses.size());
            return responses;
            
        } catch (Exception ex) {
            log.error("❌ Exception while fetching appointments for patientId: {}", patientId, ex);
            throw ex; // Let the global exception handler deal with it
        }
    }

    public List<AppointmentResponse> getDoctorAppointments(String doctorId) {
        log.debug("🔍 Querying appointments for doctorId: {}", doctorId);
        
        try {
            if (appointmentRepository == null) {
                log.error("❌ appointmentRepository is null");
                return Collections.emptyList();
            }
            
            List<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId);
            
            if (appointments == null) {
                log.warn("⚠️  appointmentRepository.findByDoctorId() returned null for doctorId: {}", doctorId);
                return Collections.emptyList();
            }
            
            log.debug("✅ Found {} appointments for doctorId: {}", appointments.size(), doctorId);
            
            List<AppointmentResponse> responses = appointments.stream()
                    .map(this::toResponse)
                    .toList();
            
            log.info("✅ Converted {} appointments to responses", responses.size());
            return responses;
            
        } catch (Exception ex) {
            log.error("❌ Exception while fetching appointments for doctorId: {}", doctorId, ex);
            throw ex;
        }
    }

    public AppointmentResponse confirmAppointment(String id, String doctorId) {
        Appointment appointment = findByIdOrThrow(id);

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
        if (a == null) {
            log.warn("⚠️  toResponse called with null appointment");
            throw new IllegalArgumentException("Appointment cannot be null");
        }

        try {
            // Validate critical fields
            if (a.getId() == null) {
                log.warn("⚠️  Appointment has null ID: {}", a);
            }

            return AppointmentResponse.builder()
                    .id(a.getId())
                    .patientId(a.getPatientId())
                    .doctorId(a.getDoctorId())
                    .appointmentDate(a.getAppointmentDate())
                    .timeSlot(a.getTimeSlot())
                    .status(a.getStatus())
                    .reason(a.getReason())
                    .consultationType(a.getConsultationType())
                    .videoSessionId(a.getVideoSessionId())
                    .createdAt(a.getCreatedAt())
                    .updatedAt(a.getUpdatedAt())
                    .build();
        } catch (Exception ex) {
            log.error("❌ Error converting appointment to response: {}", a, ex);
            throw ex;
        }
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