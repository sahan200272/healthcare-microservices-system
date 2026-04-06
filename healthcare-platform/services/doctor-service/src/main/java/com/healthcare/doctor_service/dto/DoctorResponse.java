package com.healthcare.doctor_service.dto;

import com.healthcare.doctor_service.model.Doctor.VerificationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DoctorResponse {

    private String doctorId;
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private String specialization;
    private String qualification;
    private String licenseNumber;
    private Integer experienceYears;
    private String bio;
    private Double consultationFee;
    private VerificationStatus verificationStatus;
    private boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
