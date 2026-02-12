package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class ReadingInProgressException extends DomainException {
    public ReadingInProgressException(UUID userId, UUID bookId) {
        super(DomainError.READING_ALREADY_IN_PROGRESS, userId, bookId);
    }
}
