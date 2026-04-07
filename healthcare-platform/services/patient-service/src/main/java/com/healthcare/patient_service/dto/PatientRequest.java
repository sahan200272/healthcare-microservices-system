package com.healthcare.patient_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PatientRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Min(value = 0, message = "Age must be positive")
    @Max(value = 150, message = "Age must be valid")
    private Integer age;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String bloodGroup;
    private String address;
    private String emergencyContact; // Optional: emergency contact number
}
