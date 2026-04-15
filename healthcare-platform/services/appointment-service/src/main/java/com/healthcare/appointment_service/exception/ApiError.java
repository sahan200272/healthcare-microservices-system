package com.healthcare.appointment_service.exception;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;

@Value
@Builder
public class ApiError {
    Instant timestamp;
    int status;
    String error;
    String message;
    String path;
    Map<String, String> fieldErrors;
}

