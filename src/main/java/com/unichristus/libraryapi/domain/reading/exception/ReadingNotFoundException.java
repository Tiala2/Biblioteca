package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class ReadingNotFoundException extends DomainException {
    public ReadingNotFoundException(UUID readingId) {
        super(DomainError.READING_NOT_FOUND, readingId);
    }
}
