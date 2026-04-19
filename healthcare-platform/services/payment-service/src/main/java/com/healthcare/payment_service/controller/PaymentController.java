package com.healthcare.payment_service.controller;

import com.healthcare.payment_service.dto.PaymentRequest;
import com.healthcare.payment_service.model.Payment;
import com.healthcare.payment_service.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody PaymentRequest request) {
        return new ResponseEntity<>(paymentService.createPayment(request), HttpStatus.CREATED);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Payment>> getPaymentsByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(paymentService.getPaymentsByPatientId(patientId));
    }

    @PostMapping("/verify")
    public ResponseEntity<Payment> verifyPayment(@RequestParam String sessionId) {
        return ResponseEntity.ok(paymentService.verifyStripePayment(sessionId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<Payment> getPaymentByAppointmentId(@PathVariable String appointmentId) {
        Payment payment = paymentService.getPaymentByAppointmentId(appointmentId);
        return payment != null ? ResponseEntity.ok(payment) : ResponseEntity.notFound().build();
    }
}
