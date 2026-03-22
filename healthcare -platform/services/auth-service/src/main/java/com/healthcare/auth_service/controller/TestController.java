package com.healthcare.auth_service.controller;

import com.healthcare.auth_service.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Check whether the application properties are accessible or not.

@RestController
public class TestController {

    User user = new User();

    @Value("${spring.mongodb.uri}")
    private String mongoUri;

    @Value("${server.port}")
    private String port;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private String jwtExpiration;

    @GetMapping("/test-env")
    public String testEnv() {
        return "Mongo URI: " + mongoUri +
                "\nPort: " + port +
                "\nJWT Secret: " + jwtSecret +
                "\nJWT Expiration: " + jwtExpiration +
                "\nUser: " + user.getEmail();
    }
}
