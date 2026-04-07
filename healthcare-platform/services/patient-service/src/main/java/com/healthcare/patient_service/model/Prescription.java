package com.healthcare.patient_service.model;

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

    private String patientId;
    private String doctorName;
    private String diagnosis;
    private List<String> medicines;
    private String notes;

    @CreatedDate
    private LocalDateTime prescribedAt;
}
