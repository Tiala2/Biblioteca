package com.unichristus.libraryapi.domain.review.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class ReviewAlreadyExists extends DomainException {
    public ReviewAlreadyExists() {
        super(DomainError.REVIEW_ALREADY_EXISTS);
    }
}
