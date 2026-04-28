package com.unichristus.libraryapi.infrastructure.security;

public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
