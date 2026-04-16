package com.healthcare.appointment_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AppointmentRequest {

    @NotBlank
    private String patientId;

    @NotBlank
    private String doctorId;

    @NotNull
    private LocalDate appointmentDate;

    /**
     * Expected format: {@code HH:mm-HH:mm}.
     */
    @NotBlank
    @Pattern(regexp = "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$", message = "timeSlot must be in format HH:mm-HH:mm")
    private String timeSlot;

    @Size(max = 500)
    private String reason;

    /**
     * Type of consultation: IN_PERSON or VIDEO_CONSULTATION
     */
    private String consultationType;

    public @NotBlank String getPatientId() {
        return patientId;
    }

    public @NotBlank String getDoctorId() {
        return doctorId;
    }

    public @NotNull LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$", message = "timeSlot must be in format HH:mm-HH:mm") String getTimeSlot() {
        return timeSlot;
    }

    public @Size(max = 500) String getReason() {
        return reason;
    }

    public void setPatientId(@NotBlank String patientId) {
        this.patientId = patientId;
    }

    public void setDoctorId(@NotBlank String doctorId) {
        this.doctorId = doctorId;
    }

    public void setAppointmentDate(@NotNull LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public void setTimeSlot(@NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$", message = "timeSlot must be in format HH:mm-HH:mm") String timeSlot) {
        this.timeSlot = timeSlot;
    }

    public void setReason(@Size(max = 500) String reason) {
        this.reason = reason;
    }

    public String getConsultationType() {
        return consultationType;
    }

    public void setConsultationType(String consultationType) {
        this.consultationType = consultationType;
    }
}