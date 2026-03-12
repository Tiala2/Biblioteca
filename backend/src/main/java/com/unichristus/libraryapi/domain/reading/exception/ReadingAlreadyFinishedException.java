package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class ReadingAlreadyFinishedException extends DomainException {
    public ReadingAlreadyFinishedException(UUID readingId) {
        super(DomainError.READING_ALREADY_FINISHED, readingId);
    }
}
