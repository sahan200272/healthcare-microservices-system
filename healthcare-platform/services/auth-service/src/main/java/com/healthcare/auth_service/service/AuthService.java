package com.healthcare.auth_service.service;

import com.healthcare.auth_service.dto.LoginRequest;
import com.healthcare.auth_service.dto.RegisterRequest;
import com.healthcare.auth_service.model.User;
import com.healthcare.auth_service.repository.UserRepository;
import com.healthcare.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(normalizeRole(request.getRole()));

        userRepository.save(user);
        return "User registered successfully";
    }

    public Map<String, String> login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        String normalizedRole = normalizeRole(user.getRole());
        String token = jwtUtil.generateToken(user.getEmail(), normalizedRole, user.getId());

        return Map.of(
                "token", token,
                "role", normalizedRole,
                "name", user.getName(),
                "id", user.getId()
        );
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }

        String normalized = role.trim().toUpperCase();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }

        if (!normalized.equals("PATIENT") && !normalized.equals("DOCTOR") && !normalized.equals("ADMIN")) {
            throw new IllegalArgumentException("Invalid role. Allowed: PATIENT, DOCTOR, ADMIN");
        }

        return normalized;
    }
}
