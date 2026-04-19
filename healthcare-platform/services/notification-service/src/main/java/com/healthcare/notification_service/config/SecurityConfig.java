package com.healthcare.notification_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Apply CORS configuration FIRST — before any security rules
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 2. Disable CSRF — not needed for stateless JWT APIs
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                // 3. Explicitly allow ALL OPTIONS preflight requests without auth.
                //    This is the critical fix — without this, Spring Security returns
                //    403 on preflight BEFORE the CORS filter adds the Allow-Origin header,
                //    causing the browser to report a CORS error instead of a 403.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 4. Allow all other notification endpoints (no JWT validation here)
                .anyRequest().permitAll()
            )

            // 5. Stateless session — no HTTP session, JWT only
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins — use patterns to support any localhost port (dev) + any HTTPS (prod)
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",   // Next.js dev server (3000, 3001, etc.)
            "https://*"             // Production HTTPS deployments
        ));

        // All HTTP methods including OPTIONS (preflight)
        config.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // Explicit header allowlist — wildcard "*" is rejected by browsers
        // when allowCredentials=true, so we must list them explicitly
        config.setAllowedHeaders(List.of(
            "Authorization",        // JWT Bearer token
            "Content-Type",         // application/json
            "X-Requested-With",     // Axios default
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        // Expose headers the frontend can read
        config.setExposedHeaders(List.of("Authorization"));

        // Allow credentials (required when Axios sends Authorization header)
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour to reduce OPTIONS calls
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
