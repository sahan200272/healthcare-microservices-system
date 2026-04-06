package com.healthcare.doctor_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * DTO for partial doctor profile updates (PATCH).
 * All fields are optional — only non-null fields will be applied.
 * Validation annotations are kept only for format correctness (not presence).
 */
@Data
public class DoctorUpdateRequest {

    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String specialization;

    private String qualification;

    private String licenseNumber;

    @Min(value = 0, message = "Experience years must be non-negative")
    private Integer experienceYears;

    private String bio;

    @DecimalMin(value = "0.0", inclusive = false, message = "Consultation fee must be greater than 0")
    private Double consultationFee;
}
