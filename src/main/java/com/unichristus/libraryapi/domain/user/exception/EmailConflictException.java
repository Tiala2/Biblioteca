package com.unichristus.libraryapi.domain.user.exception;

public class EmailConflictException extends RuntimeException {
    public EmailConflictException(String email) {
        super("Já existe um usuário cadastrado com o email: " + email);
    }
}
