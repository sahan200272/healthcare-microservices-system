package com.healthcare.payment_service.service;

import com.healthcare.payment_service.dto.PaymentRequest;
import com.healthcare.payment_service.model.Payment;
import com.healthcare.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public Payment createPayment(PaymentRequest request) {
        Payment payment = new Payment();
        payment.setAppointmentId(request.getAppointmentId());
        payment.setPatientId(request.getPatientId());
        payment.setDoctorId(request.getDoctorId());
        payment.setAmount(request.getAmount());
        payment.setPaymentStatus("COMPLETED");

        return paymentRepository.save(payment);
    }

    public Payment getPaymentById(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));
    }

    public List<Payment> getPaymentsByPatientId(String patientId) {
        return paymentRepository.findByPatientId(patientId);
    }
}
