package com.healthcare.doctor_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "prescriptions")
@Data
public class Prescription {

    @Id
    private String prescriptionId;

    private String doctorId;

    // References Patient Service
    private String patientId;

    // References Appointment Service
    private String appointmentId;

    private String diagnosis;
    private List<Medication> medications;
    private String notes;

    @CreatedDate
    private LocalDateTime issuedAt;

    @Data
    public static class Medication {
        private String name;
        private String dosage;
        private String frequency; // e.g. "twice daily"
        private String duration;  // e.g. "7 days"
        private String instructions;
    }
}
