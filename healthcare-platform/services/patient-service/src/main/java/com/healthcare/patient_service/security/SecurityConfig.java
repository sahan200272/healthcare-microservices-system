package com.healthcare.patient_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

                        // PATIENT can create & update their own profile
                        .requestMatchers(HttpMethod.POST, "/api/patients").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/patients/*").hasRole("PATIENT")

                        // PATIENT can upload reports and add medical history
                        .requestMatchers(HttpMethod.POST, "/api/patients/*/reports").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.POST, "/api/patients/*/history").hasRole("PATIENT")

                        // DOCTOR or ADMIN can add prescriptions
                        .requestMatchers(HttpMethod.POST, "/api/patients/*/prescriptions").hasAnyRole("DOCTOR", "ADMIN")

                        // All other requests (GET endpoints) need to be authenticated
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
