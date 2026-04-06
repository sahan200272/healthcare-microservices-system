package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.AvailabilityRequest;
import com.healthcare.doctor_service.dto.AvailabilityResponse;
import com.healthcare.doctor_service.exception.BadRequestException;
import com.healthcare.doctor_service.model.Availability;
import com.healthcare.doctor_service.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
