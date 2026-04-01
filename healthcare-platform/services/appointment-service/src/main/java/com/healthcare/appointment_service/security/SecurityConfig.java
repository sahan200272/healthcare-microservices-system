package com.healthcare.appointment_service.security;

import lombok.RequiredArgsConstructor;
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

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth

                        // PATIENT actions
                        .requestMatchers("/api/appointments/book").hasRole("PATIENT")
                        .requestMatchers("/api/appointments/patient/**").hasRole("PATIENT")
                        .requestMatchers("/api/appointments/*/cancel").hasRole("PATIENT")

                        // DOCTOR actions
                        .requestMatchers("/api/appointments/doctor/**").hasRole("DOCTOR")

                        // ADMIN access
                        .requestMatchers("/api/appointments/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}