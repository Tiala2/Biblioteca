package com.unichristus.libraryapi.domain.favorite.exception;

import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;

import java.util.UUID;

public class FavoriteAlreadyExistsException extends DomainException {
    public FavoriteAlreadyExistsException(UUID userId, UUID bookId) {
        super(DomainError.FAVORITE_ALREADY_EXISTS, userId, bookId);
    }
}
