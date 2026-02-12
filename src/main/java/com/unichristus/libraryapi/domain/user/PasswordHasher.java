package com.unichristus.libraryapi.domain.user;

public interface PasswordHasher {
    String hash(String rawPassword);
}
