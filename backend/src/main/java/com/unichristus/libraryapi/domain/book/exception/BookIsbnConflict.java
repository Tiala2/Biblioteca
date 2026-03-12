package com.unichristus.libraryapi.domain.book.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class BookIsbnConflict extends DomainException {
    public BookIsbnConflict(String isbn) {
        super(DomainError.ISBN_CONFLICT, isbn);
    }
}
