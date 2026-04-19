package com.healthcare.ai_symptom_service.exception;

/**
 * Typed exception for Gemini API failures.
 * Carries the HTTP status so the GlobalExceptionHandler can distinguish
 * 4xx (config / auth problems) from 5xx (external service failures).
 */
public class GeminiServiceException extends RuntimeException {

    private final int httpStatus;
    private final boolean retryable;

    public GeminiServiceException(String message, int httpStatus, boolean retryable) {
        super(message);
        this.httpStatus = httpStatus;
        this.retryable = retryable;
    }

    public GeminiServiceException(String message, int httpStatus, boolean retryable, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
        this.retryable = retryable;
    }

    public int getHttpStatus() { return httpStatus; }
    public boolean isRetryable() { return retryable; }
}
