package com.unichristus.libraryapi.domain.tag.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

public class TagAlreadyExistsException extends DomainException {

    public TagAlreadyExistsException(String tagName) {
        super(DomainError.TAG_ALREADY_EXISTS, tagName);
    }
}
