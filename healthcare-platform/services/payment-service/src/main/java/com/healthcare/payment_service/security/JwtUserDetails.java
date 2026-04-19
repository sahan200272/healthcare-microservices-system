package com.healthcare.payment_service.security;

public record JwtUserDetails(String userId, String email, String role, String token) {}

