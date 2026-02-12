package com.unichristus.libraryapi.domain.book.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class BookPdfSizeExceeded extends DomainException {
    public BookPdfSizeExceeded(int maxSizeMb) {
        super(DomainError.PDF_SIZE_EXCEEDED, maxSizeMb);
    }
}
