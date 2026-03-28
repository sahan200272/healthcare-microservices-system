package com.healthcare.patient_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PatientResponse {
    private String patientId;
    private String userId;
    private String fullName;
    private Integer age;
    private String gender;
    private String phone;
    private String bloodGroup;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
