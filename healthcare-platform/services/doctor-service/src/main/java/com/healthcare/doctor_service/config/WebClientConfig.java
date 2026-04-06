package com.healthcare.doctor_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    /**
     * WebClient configured for Appointment Service.
     * Base URL is injected from application.properties and resolved via .env.
     *
     * [INTEGRATION POINT] The Appointment Service must be running and reachable
     * at the configured URL for accept/reject actions to work end-to-end.
     */
    @Bean
    public WebClient appointmentWebClient(
            @Value("${services.appointment.base-url}") String appointmentBaseUrl) {
        return WebClient.builder()
                .baseUrl(appointmentBaseUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    public RestTemplate appointmentRestTemplate(
            @Value("${services.appointment.base-url}") String appointmentBaseUrl) {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory(appointmentBaseUrl));
        return restTemplate;
    }

    /**
     * WebClient configured for Patient Service.
     * Used when fetching patient details for consultation or prescription validation.
     *
     * [INTEGRATION POINT] Inject and use this WebClient in a PatientClientService
     * to call GET /api/patients/{patientId} on the Patient Service.
     */
    @Bean
    public WebClient patientWebClient(
            @Value("${services.patient.base-url}") String patientBaseUrl) {
        return WebClient.builder()
                .baseUrl(patientBaseUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
