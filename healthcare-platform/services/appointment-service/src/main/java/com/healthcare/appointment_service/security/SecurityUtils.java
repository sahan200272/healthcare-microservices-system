package com.healthcare.appointment_service.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Slf4j
public final class SecurityUtils {
    private SecurityUtils() {}

    /**
     * Safely retrieves the current authenticated user's ID from JWT claims.
     * 
     * @return Optional containing userId if present and authenticated, empty otherwise
     */
    public static Optional<String> currentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            // Guard 1: Check if auth is null
            if (auth == null) {
                log.debug("🔍 SecurityContextHolder.getAuthentication() returned null");
                return Optional.empty();
            }
            
            // Guard 2: Check if authenticated
            if (!auth.isAuthenticated()) {
                log.debug("🔍 Authentication present but not authenticated");
                return Optional.empty();
            }
            
            // Guard 3: Check if details is JwtUserDetails
            Object details = auth.getDetails();
            if (details instanceof JwtUserDetails jwt) {
                String userId = jwt.userId();
                if (userId != null && !userId.isBlank()) {
                    log.debug("✅ Retrieved userId from JWT: {}", userId);
                    return Optional.of(userId);
                } else {
                    log.debug("⚠️  JwtUserDetails.userId() is null or blank");
                    return Optional.empty();
                }
            }
            
            log.debug("⚠️  auth.getDetails() is not JwtUserDetails. Type: {}", 
                    details != null ? details.getClass().getSimpleName() : "null");
            return Optional.empty();
            
        } catch (Exception e) {
            log.error("❌ Exception in SecurityUtils.currentUserId(): ", e);
            return Optional.empty();
        }
    }

    /**
     * Safely retrieves the current authenticated user's role from JWT claims.
     * 
     * @return Optional containing role if present and authenticated, empty otherwise
     */
    public static Optional<String> currentRole() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated()) {
                return Optional.empty();
            }
            
            Object details = auth.getDetails();
            if (details instanceof JwtUserDetails jwt) {
                return Optional.ofNullable(jwt.role());
            }
            
            return Optional.empty();
        } catch (Exception e) {
            log.error("❌ Exception in SecurityUtils.currentRole(): ", e);
            return Optional.empty();
        }
    }

    /**
     * Safely retrieves the current authenticated user's JWT token.
     *
     * @return Optional containing the token if present, empty otherwise
     */
    public static Optional<String> currentToken() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return Optional.empty();
            }

            Object details = auth.getDetails();
            if (details instanceof JwtUserDetails jwt) {
                return Optional.ofNullable(jwt.token());
            }

            return Optional.empty();
        } catch (Exception e) {
            log.error("❌ Exception in SecurityUtils.currentToken(): ", e);
            return Optional.empty();
        }
    }

    /**
     * Checks if current user is authenticated.
     */
    public static boolean isAuthenticated() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null && auth.isAuthenticated();
        } catch (Exception e) {
            log.error("❌ Exception in SecurityUtils.isAuthenticated(): ", e);
            return false;
        }
    }
}

