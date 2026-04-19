package com.healthcare.payment_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {

    @NotBlank(message = "Appointment ID is required")
    private String appointmentId;

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Patient email is required")
    private String patientEmail;

    @NotBlank(message = "Doctor ID is required")
    private String doctorId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;
}
