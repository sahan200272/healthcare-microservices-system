package com.healthcare.doctor_service.dto;

import lombok.Data;

/**
 * DTO representing patient data returned by the Patient Service.
 * Fields mirror the PatientResponse in patient-service.
 */
@Data
public class PatientDetailsResponse {
    private String patientId;
    private String userId;
    private String fullName;
    private Integer age;
    private String gender;
    private String phone;
    private String bloodGroup;
    private String address;
}
