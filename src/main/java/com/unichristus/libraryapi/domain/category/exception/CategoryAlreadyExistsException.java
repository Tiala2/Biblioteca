package com.unichristus.libraryapi.domain.category.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class CategoryAlreadyExistsException extends DomainException {
    public CategoryAlreadyExistsException(String name) {
        super(DomainError.CATEGORY_ALREADY_EXISTS, name);
    }
}
