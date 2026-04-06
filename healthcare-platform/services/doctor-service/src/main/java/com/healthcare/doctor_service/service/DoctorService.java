package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.DoctorRequest;
import com.healthcare.doctor_service.dto.DoctorResponse;
import com.healthcare.doctor_service.dto.DoctorUpdateRequest;
import com.healthcare.doctor_service.exception.BadRequestException;
import com.healthcare.doctor_service.exception.ResourceNotFoundException;
import com.healthcare.doctor_service.model.Doctor;
import com.healthcare.doctor_service.model.Doctor.VerificationStatus;
import com.healthcare.doctor_service.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorResponse registerDoctor(DoctorRequest request, String userId) {
        if (doctorRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A doctor with this email already exists.");
        }
        if (doctorRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new BadRequestException("A doctor with this license number already exists.");
        }

        Doctor doctor = new Doctor();
        doctor.setUserId(userId);
        mapRequestToDoctor(request, doctor);

        Doctor saved = doctorRepository.save(doctor);
        return toResponse(saved);
    }

    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DoctorResponse getDoctorById(String doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        return toResponse(doctor);
    }

    public DoctorResponse updateDoctor(String doctorId, DoctorUpdateRequest request, String currentUserId) {
        Doctor doctor = findDoctorOrThrow(doctorId);

        // Doctors may only update their own profile
        if (!doctor.getUserId().equals(currentUserId)) {
            throw new BadRequestException("You are not authorized to update this profile.");
        }

        // Guard against email collision from another doctor (only when email is being changed)
        if (request.getEmail() != null) {
            doctorRepository.findByEmail(request.getEmail())
                    .ifPresent(existing -> {
                        if (!existing.getDoctorId().equals(doctorId)) {
                            throw new BadRequestException("Email is already in use by another doctor.");
                        }
                    });
        }

        patchDoctor(request, doctor);
        Doctor updated = doctorRepository.save(doctor);
        return toResponse(updated);
    }

    public void deleteDoctor(String doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }
        doctorRepository.deleteById(doctorId);
    }

    // --- Admin verification ---

    public DoctorResponse approveDoctor(String doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        doctor.setVerificationStatus(VerificationStatus.APPROVED);
        doctor.setVerified(true);
        return toResponse(doctorRepository.save(doctor));
    }

    public DoctorResponse rejectDoctor(String doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        doctor.setVerificationStatus(VerificationStatus.REJECTED);
        doctor.setVerified(false);
        return toResponse(doctorRepository.save(doctor));
    }

    public List<DoctorResponse> getDoctorsByVerificationStatus(String status) {
        VerificationStatus verificationStatus;
        try {
            verificationStatus = VerificationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid verification status: " + status);
        }
        return doctorRepository.findByVerificationStatus(verificationStatus)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // --- Helpers ---

    public Doctor findDoctorOrThrow(String doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
    }

    private void mapRequestToDoctor(DoctorRequest request, Doctor doctor) {
        doctor.setFullName(request.getFullName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setBio(request.getBio());
        doctor.setConsultationFee(request.getConsultationFee());
    }

    private void patchDoctor(DoctorUpdateRequest request, Doctor doctor) {
        if (request.getFullName() != null) doctor.setFullName(request.getFullName());
        if (request.getEmail() != null) doctor.setEmail(request.getEmail());
        if (request.getPhone() != null) doctor.setPhone(request.getPhone());
        if (request.getSpecialization() != null) doctor.setSpecialization(request.getSpecialization());
        if (request.getQualification() != null) doctor.setQualification(request.getQualification());
        if (request.getLicenseNumber() != null) doctor.setLicenseNumber(request.getLicenseNumber());
        if (request.getExperienceYears() != null) doctor.setExperienceYears(request.getExperienceYears());
        if (request.getBio() != null) doctor.setBio(request.getBio());
        if (request.getConsultationFee() != null) doctor.setConsultationFee(request.getConsultationFee());
    }

    public DoctorResponse toResponse(Doctor doctor) {
        DoctorResponse response = new DoctorResponse();
        response.setDoctorId(doctor.getDoctorId());
        response.setUserId(doctor.getUserId());
        response.setFullName(doctor.getFullName());
        response.setEmail(doctor.getEmail());
        response.setPhone(doctor.getPhone());
        response.setSpecialization(doctor.getSpecialization());
        response.setQualification(doctor.getQualification());
        response.setLicenseNumber(doctor.getLicenseNumber());
        response.setExperienceYears(doctor.getExperienceYears());
        response.setBio(doctor.getBio());
        response.setConsultationFee(doctor.getConsultationFee());
        response.setVerificationStatus(doctor.getVerificationStatus());
        response.setVerified(doctor.isVerified());
        response.setCreatedAt(doctor.getCreatedAt());
        response.setUpdatedAt(doctor.getUpdatedAt());
        return response;
    }
}
