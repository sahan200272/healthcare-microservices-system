package com.healthcare.payment_service.repository;

import com.healthcare.payment_service.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    List<Payment> findByPatientId(String patientId);
    List<Payment> findByStripeSessionId(String stripeSessionId);
    List<Payment> findByAppointmentId(String appointmentId);
}
