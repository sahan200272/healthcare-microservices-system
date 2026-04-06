package com.healthcare.doctor_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "doctors")
@Data
public class Doctor {

    @Id
    private String doctorId;

    @Indexed(unique = true)
    private String userId; // References Auth Service user

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String phone;
    private String specialization;
    private String qualification;

    @Indexed(unique = true)
    private String licenseNumber;

    private Integer experienceYears;
    private String bio;
    private Double consultationFee;

    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    private boolean verified = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum VerificationStatus {
        PENDING, APPROVED, REJECTED
    }
}
