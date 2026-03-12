package com.unichristus.libraryapi.domain.book.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class BookPdfNotFoundException extends DomainException {
    public BookPdfNotFoundException(UUID bookId) {
        super(DomainError.BOOK_PDF_NOT_FOUND, bookId);
    }
}
