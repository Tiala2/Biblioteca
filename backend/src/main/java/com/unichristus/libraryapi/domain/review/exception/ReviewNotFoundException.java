package com.unichristus.libraryapi.domain.review.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class ReviewNotFoundException extends DomainException {

    public ReviewNotFoundException(UUID reviewId) {
        super(DomainError.READING_NOT_FOUND, reviewId);
    }
}
