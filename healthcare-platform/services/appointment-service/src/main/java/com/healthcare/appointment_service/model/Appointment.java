//healthcare-microservices-system/healthcare/services/appointment-service/src/main/java/com.healthcare.appointment_service/model/Appointment

package com.healthcare.appointment_service.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;

    private String patientId;
    private String doctorId;

    private LocalDateTime appointmentDate;

    private String status; // BOOKED, CANCELLED, COMPLETED

    private LocalDateTime createdAt;

}
