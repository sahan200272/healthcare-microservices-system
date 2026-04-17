package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.AvailabilityRequest;
import com.healthcare.doctor_service.dto.AvailabilityResponse;
import com.healthcare.doctor_service.exception.BadRequestException;
import com.healthcare.doctor_service.model.Availability;
import com.healthcare.doctor_service.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final DoctorService doctorService;

    public AvailabilityResponse addAvailability(String doctorId, AvailabilityRequest request) {
        // Ensure doctor exists
        doctorService.findDoctorOrThrow(doctorId);

        if (request.getAvailableDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Available date cannot be in the past.");
        }

        // If a slot for this date already exists, merge or replace time slots
        Availability availability = availabilityRepository
                .findByDoctorIdAndAvailableDate(doctorId, request.getAvailableDate())
                .orElseGet(Availability::new);

        availability.setDoctorId(doctorId);
        availability.setAvailableDate(request.getAvailableDate());
        availability.setTimeSlots(request.getTimeSlots());
        // Always ensure bookedSlots is never null
        availability.setBookedSlots(
                availability.getBookedSlots() != null ? availability.getBookedSlots() : new ArrayList<>()
        );
        availability.setActive(true);

        Availability saved = availabilityRepository.save(availability);
        return toResponse(saved);
    }

    public List<AvailabilityResponse> getUpcomingAvailability(String doctorId) {
        doctorService.findDoctorOrThrow(doctorId);

        return availabilityRepository
                .findByDoctorIdAndAvailableDateGreaterThanEqualAndActiveTrue(doctorId, LocalDate.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Checks whether a specific time slot is still available for a doctor on a given date.
     *
     * <p><b>Important:</b> {@code requestedSlot} must be the bare HH:mm start-time
     * (e.g. {@code "09:00"}), because that is how {@code timeSlots} are stored in MongoDB.
     * The Appointment Service sends slots as {@code "HH:mm-HH:mm"} ranges; it must extract
     * only the start portion before calling this method.
     *
     * @return {@code true} if the slot is listed in timeSlots AND not yet in bookedSlots
     */
    public boolean isDoctorAvailable(String doctorId, LocalDate date, String requestedSlot) {
        return availabilityRepository
                .findByDoctorIdAndAvailableDate(doctorId, date)
                .map(a -> {
                    List<String> timeSlots   = a.getTimeSlots()   != null ? a.getTimeSlots()   : List.of();
                    List<String> bookedSlots = a.getBookedSlots() != null ? a.getBookedSlots() : List.of();
                    boolean inTimeSlots  = timeSlots.contains(requestedSlot);
                    boolean alreadyBooked = bookedSlots.contains(requestedSlot);
                    log.debug("[isDoctorAvailable] doctorId={} date={} slot={} inTimeSlots={} alreadyBooked={}",
                            doctorId, date, requestedSlot, inTimeSlots, alreadyBooked);
                    return inTimeSlots && !alreadyBooked;
                })
                .orElse(false);
    }

    /**
     * Atomically marks a time slot as booked in the doctor's availability document.
     *
     * <p>Uses MongoDB {@code $addToSet} via a custom query to be idempotent and
     * race-condition safe — two concurrent requests for the same slot will both write,
     * but the set semantics ensure the slot appears only once.
     *
     * <p>The caller MUST have already verified availability before calling this method.
     *
     * @param doctorId      the doctor's MongoDB _id
     * @param date          the appointment date
     * @param requestedSlot the bare start-time of the slot, e.g. {@code "09:00"}
     * @throws BadRequestException if no availability document exists for doctorId + date
     * @throws BadRequestException if the slot is not in the doctor's timeSlots list
     * @throws BadRequestException if the slot is already booked
     */
    public void bookSlot(String doctorId, LocalDate date, String requestedSlot) {
        Availability availability = availabilityRepository
                .findByDoctorIdAndAvailableDate(doctorId, date)
                .orElseThrow(() -> new BadRequestException(
                        "No availability found for doctor " + doctorId + " on " + date));

        // Guard: slot must exist in the published time-slots
        List<String> timeSlots = availability.getTimeSlots() != null
                ? availability.getTimeSlots() : List.of();
        if (!timeSlots.contains(requestedSlot)) {
            throw new BadRequestException(
                    "Time slot '" + requestedSlot + "' is not in the doctor's availability for " + date);
        }

        // Guard: slot must not already be booked
        List<String> bookedSlots = availability.getBookedSlots() != null
                ? availability.getBookedSlots() : List.of();
        if (bookedSlots.contains(requestedSlot)) {
            throw new BadRequestException("Slot '" + requestedSlot + "' is already booked");
        }

        // Atomic $addToSet — idempotent, safe under concurrent requests
        availabilityRepository.addToBookedSlots(availability.getAvailabilityId(), requestedSlot);
        log.info("[bookSlot] Slot '{}' marked as booked for doctorId={} on {}", requestedSlot, doctorId, date);
    }

    private AvailabilityResponse toResponse(Availability availability) {
        AvailabilityResponse response = new AvailabilityResponse();
        response.setAvailabilityId(availability.getAvailabilityId());
        response.setDoctorId(availability.getDoctorId());
        response.setAvailableDate(availability.getAvailableDate());
        response.setTimeSlots(availability.getTimeSlots());
        response.setBookedSlots(availability.getBookedSlots());
        response.setActive(availability.isActive());
        response.setCreatedAt(availability.getCreatedAt());
        response.setUpdatedAt(availability.getUpdatedAt());
        return response;
    }
}
