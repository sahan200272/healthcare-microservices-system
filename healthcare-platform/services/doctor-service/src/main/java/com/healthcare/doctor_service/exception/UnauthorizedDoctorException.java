package com.healthcare.doctor_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class UnauthorizedDoctorException extends RuntimeException {

    public UnauthorizedDoctorException(String message) {
        super(message);
    }
}
