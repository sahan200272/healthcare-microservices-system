package com.healthcare.payment_service.service;

import com.healthcare.payment_service.dto.PaymentRequest;
import com.healthcare.payment_service.model.Payment;
import com.healthcare.payment_service.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${stripe.secret.key:sk_test_placeholder_key}")
    private String stripeSecretKey;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public Payment createPayment(PaymentRequest request) {
        Payment payment = new Payment();
        payment.setAppointmentId(request.getAppointmentId().trim());
        payment.setPatientId(request.getPatientId().trim());
        payment.setDoctorId(request.getDoctorId().trim());
        payment.setAmount(request.getAmount());
        payment.setPaymentStatus("PENDING");

        // Save immediately to generate an ID
        payment = paymentRepository.save(payment);

        try {
            // LKR is 0-decimal in Stripe or 2-decimal? Stripe expects smallest currency unit. LKR is traditionally 2 decimals, so multiply by 100.
            long amountInCents = request.getAmount().multiply(new BigDecimal("100")).longValue();

            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCustomerEmail(request.getPatientEmail())
                .setSuccessUrl(frontendUrl + "/payments?status=success&session_id={CHECKOUT_SESSION_ID}" + 
                    "&appointmentId=" + request.getAppointmentId() + 
                    "&doctorId=" + request.getDoctorId())
                .setCancelUrl(frontendUrl + "/payments?status=cancelled")
                .putMetadata("paymentId", payment.getPaymentId())
                .putMetadata("appointmentId", request.getAppointmentId())
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("lkr")
                                .setUnitAmount(amountInCents)
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Healthcare Consultation - " + request.getDoctorId())
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .build();

            Session session = Session.create(params);
            
            payment.setStripeSessionId(session.getId());
            payment.setCheckoutUrl(session.getUrl());
            
            paymentRepository.save(payment);

        } catch (Exception e) {
            System.err.println("Stripe session creation failed: " + e.getMessage());
            e.printStackTrace();
        }

        return payment;
    }

    public Payment verifyStripePayment(String sessionId) {
        try {
            com.stripe.param.checkout.SessionRetrieveParams params = com.stripe.param.checkout.SessionRetrieveParams.builder()
                .addExpand("payment_intent.latest_charge")
                .build();
            
            Session session = Session.retrieve(sessionId, params, null);
            String status = session.getPaymentStatus();
            
            // Safety: Select latest record if duplicates exist
            List<Payment> payments = paymentRepository.findByStripeSessionId(sessionId);
            if (payments.isEmpty()) {
                throw new RuntimeException("Payment record not found for session: " + sessionId);
            }
            Payment payment = payments.get(payments.size() - 1);

            // Always attempt to capture date and receipt URL if we see a "paid" session
            System.out.println("DEBUG: Stripe session " + sessionId + " status is: " + status);
            
            if ("paid".equalsIgnoreCase(status)) {
                boolean wasUpdated = false;
                
                if (!"COMPLETED".equals(payment.getPaymentStatus())) {
                    payment.setPaymentStatus("COMPLETED");
                    wasUpdated = true;
                }
                
                if (payment.getPaymentDate() == null) {
                    payment.setPaymentDate(java.time.LocalDateTime.now());
                    wasUpdated = true;
                }
                
                // Extract official receipt URL if not already present
                if (payment.getReceiptUrl() == null) {
                    try {
                        if (session.getPaymentIntentObject() != null && 
                            session.getPaymentIntentObject().getLatestChargeObject() != null) {
                            String receiptUrl = session.getPaymentIntentObject().getLatestChargeObject().getReceiptUrl();
                            payment.setReceiptUrl(receiptUrl);
                            wasUpdated = true;
                        }
                    } catch (Exception e) {
                        System.err.println("Could not extract receipt URL: " + e.getMessage());
                    }
                }

                paymentRepository.save(payment);
                System.out.println("DEBUG: Payment " + payment.getPaymentId() + " updated to COMPLETED");
            }
            
            return payment;
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify Stripe payment: " + e.getMessage());
        }
    }

    public Payment getPaymentByAppointmentId(String appointmentId) {
        List<Payment> payments = paymentRepository.findByAppointmentId(appointmentId);
        return payments.isEmpty() ? null : payments.get(payments.size() - 1);
    }

    public Payment getPaymentById(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));
    }

    public List<Payment> getPaymentsByPatientId(String patientId) {
        return paymentRepository.findByPatientId(patientId);
    }
}
