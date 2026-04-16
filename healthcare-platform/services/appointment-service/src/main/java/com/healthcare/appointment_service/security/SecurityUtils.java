package com.healthcare.appointment_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static Optional<String> currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();

        Object details = auth.getDetails();
        if (details instanceof JwtUserDetails jwt) {
            return Optional.ofNullable(jwt.userId());
        }

        return Optional.empty();
    }

    public static Optional<String> currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();
        Object details = auth.getDetails();
        if (details instanceof JwtUserDetails jwt) return Optional.ofNullable(jwt.role());
        return Optional.empty();
    }
}

