package com.unichristus.libraryapi.domain.exception;

import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode(callSuper = true)
public class DomainException extends RuntimeException {
    private final DomainError error;

    public DomainException(DomainError error, Object... parameters) {
        super(String.format(error.getDescription(), parameters));
        this.error = error;
    }
}
