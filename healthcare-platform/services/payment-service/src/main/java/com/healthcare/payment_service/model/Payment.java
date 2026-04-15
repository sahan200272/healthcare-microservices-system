package com.healthcare.payment_service.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "payments")
@Data
public class Payment {

    @Id
    private String paymentId;

    private String appointmentId;
    private String patientId;
    private String doctorId;
    private BigDecimal amount;
    private String paymentStatus;

    @CreatedDate
    private LocalDateTime paymentDate;
}
