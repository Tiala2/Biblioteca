package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class PdfNotAvailableException extends DomainException {
    public PdfNotAvailableException(UUID bookId) {
        super(DomainError.PDF_NOT_AVAILABLE, bookId);
    }
}
