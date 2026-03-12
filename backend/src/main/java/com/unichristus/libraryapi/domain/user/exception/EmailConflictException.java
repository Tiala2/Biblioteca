package com.unichristus.libraryapi.domain.user.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class EmailConflictException extends DomainException {
    public EmailConflictException(String email) {
        super(DomainError.EMAIL_ALREADY_EXISTS, email);
    }
}
