package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class ReadingBelongsToAnotherUserException extends DomainException {
    public ReadingBelongsToAnotherUserException() {
        super(DomainError.READING_BELONGS_TO_ANOTHER_USER);
    }
}
