package com.unichristus.libraryapi.domain.review.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class ReviewBelongsToAnotherUserException extends DomainException {
    public ReviewBelongsToAnotherUserException() {
        super(DomainError.REVIEW_BELONGS_TO_ANOTHER_USER);
    }
}
