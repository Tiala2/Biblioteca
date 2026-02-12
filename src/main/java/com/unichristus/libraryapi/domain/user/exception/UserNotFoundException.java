package com.unichristus.libraryapi.domain.user.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String user) {
        super("Usuário não encontrado: " + user);
    }
}
