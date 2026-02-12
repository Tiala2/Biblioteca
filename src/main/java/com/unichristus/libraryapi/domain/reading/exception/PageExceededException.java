package com.unichristus.libraryapi.domain.reading.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class PageExceededException extends DomainException {
    public PageExceededException() {
        super(DomainError.PAGE_EXCEEDED);
    }
}
