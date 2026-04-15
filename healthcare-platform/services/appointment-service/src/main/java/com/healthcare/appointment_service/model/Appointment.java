package com.healthcare.appointment_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "appointments")
@CompoundIndexes({
        @CompoundIndex(
                name = "doctor_date_slot_idx",
                def = "{'doctorId': 1, 'appointmentDate': 1, 'timeSlot': 1}"
        ),
        @CompoundIndex(
                name = "patient_date_idx",
                def = "{'patientId': 1, 'appointmentDate': -1}"
        )
})
public class Appointment {

    @Id
    private String id;

    private String patientId;
    private String doctorId;

    /**
     * Date component of the appointment (time is stored separately in {@code timeSlot}).
     */
    private LocalDate appointmentDate;

    /**
     * Appointment slot in format {@code HH:mm-HH:mm} (e.g., {@code 09:00-09:30}).
     */
    private String timeSlot;

    private AppointmentStatus status;

    private String reason;

    private Instant createdAt;
    private Instant updatedAt;
}
