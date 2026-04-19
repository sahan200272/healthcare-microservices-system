package com.healthcare.api_gateway.filter;

import com.healthcare.api_gateway.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter implements GlobalFilter {

    private final JwtUtil jwtUtil;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/doctors/register",
            "/api/doctors/search",
            "/api/symptoms/check"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // extracts the URL path from the incoming request (example: /api/auth/register)
        // the current HTTP request + response
        String path = exchange.getRequest().getURI().getPath();

        // Skip auth for OPTIONS requests (CORS preflight)
        if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        // Check if this is a public path
        boolean isPublic = PUBLIC_PATHS.stream()
                .anyMatch(path::startsWith);

        // If public -> skip security
        if (isPublic) {
            log.debug("Skipping JWT auth for public path {}", path);
            return chain.filter(exchange);
        }

        // Get Authorization header
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst("Authorization");

        // No token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Unauthorized request to {}: missing/invalid Authorization header", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // Remove Bearer and keeps only JWT token
        String token = authHeader.substring(7);

        // Invalid token
        if (!jwtUtil.isTokenValid(token)) {
            log.warn("Unauthorized request to {}: invalid JWT", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // Valid — forward with user info headers
        String email = jwtUtil.extractEmail(token);
        String role  = jwtUtil.extractRole(token);
        log.debug("JWT validated at gateway for {} with role {}", email, role);

        // add custom headers to the request before forwarding it to another microservice
        return chain.filter(
                exchange.mutate() // mutate() = create a modified copy
                        .request(exchange.getRequest().mutate()
                                .header("X-User-Email", email)
                                .header("X-User-Role", role)
                                .build())
                        .build()
        );
    }
}