package com.unichristus.libraryapi.domain.book.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class BookNotFoundException extends DomainException {
    public BookNotFoundException(UUID bookId) {
        super(DomainError.BOOK_NOT_FOUND, bookId);
    }
}
