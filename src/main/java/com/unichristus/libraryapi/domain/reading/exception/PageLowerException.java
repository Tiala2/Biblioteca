package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class PageLowerException extends DomainException {
    public PageLowerException() {
        super(DomainError.PAGE_LOWER);
    }
}
