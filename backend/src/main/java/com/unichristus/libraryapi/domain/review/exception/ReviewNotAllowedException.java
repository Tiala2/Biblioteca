package com.unichristus.libraryapi.domain.review.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class ReviewNotAllowedException extends DomainException {
    public ReviewNotAllowedException() {
        super(DomainError.REVIEW_NOT_ALLOWED);
    }
}
