package com.unichristus.libraryapi.domain.category.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class CategoryNotFoundException extends DomainException {
    public CategoryNotFoundException() {
        super(DomainError.CATEGORY_NOT_FOUND);
    }
}
