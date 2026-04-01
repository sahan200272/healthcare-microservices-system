package com.healthcare.patient_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "patients")
@Data
public class Patient {
    
    @Id
    private String patientId;

    @Indexed(unique = true)
    private String userId; // Reference to Auth Service User

    private String fullName;
    private Integer age;
    private String gender;
    private String phone;
    private String bloodGroup;
    private String address;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
