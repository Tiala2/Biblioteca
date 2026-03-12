package com.unichristus.libraryapi.domain.tag.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class TagNotFoundException extends DomainException {

    public TagNotFoundException(UUID tagId) {
        super(DomainError.TAG_NOT_FOUND, tagId);
    }
}
