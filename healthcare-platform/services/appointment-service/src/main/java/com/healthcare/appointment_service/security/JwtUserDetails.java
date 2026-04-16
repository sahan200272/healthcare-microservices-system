package com.healthcare.appointment_service.security;

public record JwtUserDetails(String userId, String email, String role, String token) {}

