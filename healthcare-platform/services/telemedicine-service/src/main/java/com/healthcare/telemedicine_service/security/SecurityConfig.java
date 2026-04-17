package com.healthcare.telemedicine_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth

                        // Only DOCTOR or PATIENT can create a session
                        .requestMatchers("/api/sessions/create").hasAnyRole("DOCTOR", "PATIENT")

                        // Only DOCTOR can activate (start) a session by appointmentId
                        .requestMatchers("/api/sessions/*/activate").hasRole("DOCTOR")

                        // Only DOCTOR can start or end a session by sessionId (legacy)
                        .requestMatchers("/api/sessions/*/start").hasRole("DOCTOR")
                        .requestMatchers("/api/sessions/*/end").hasRole("DOCTOR")

                        // PATIENT can view their own sessions
                        .requestMatchers("/api/sessions/patient/**").hasRole("PATIENT")

                        // DOCTOR can view their own sessions
                        .requestMatchers("/api/sessions/doctor/**").hasRole("DOCTOR")

                        // ADMIN, DOCTOR, and PATIENT can view session by appointmentId
                        .requestMatchers("/api/sessions/appointment/**").hasAnyRole("ADMIN", "DOCTOR", "PATIENT")

                        // All other requests must be authenticated
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
