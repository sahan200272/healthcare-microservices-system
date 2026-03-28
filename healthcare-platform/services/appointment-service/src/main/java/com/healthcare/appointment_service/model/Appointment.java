//healthcare-microservices-system/healthcare/services/appointment-service/src/main/java/com.healthcare.appointment_service/model/Appointment

package com.healthcare.appointment_service.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;

    private String patentId;
    private String doctorId;
    private String date;
    private String time;
    private String status;   // booked, cancelled
}
