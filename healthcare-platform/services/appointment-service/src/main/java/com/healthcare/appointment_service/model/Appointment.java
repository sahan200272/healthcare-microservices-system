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

    /**
     * Type of consultation: IN_PERSON or VIDEO_CONSULTATION
     */
    private String consultationType;

    /**
     * Reference to VideoSession ID if this is a video consultation
     */
    private String videoSessionId;

    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public String getPatientId() {
        return patientId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public String getTimeSlot() {
        return timeSlot;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getConsultationType() {
        return consultationType;
    }

    public void setConsultationType(String consultationType) {
        this.consultationType = consultationType;
    }

    public String getVideoSessionId() {
        return videoSessionId;
    }

    public void setVideoSessionId(String videoSessionId) {
        this.videoSessionId = videoSessionId;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
