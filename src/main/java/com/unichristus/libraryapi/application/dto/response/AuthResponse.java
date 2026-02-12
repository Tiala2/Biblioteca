package com.unichristus.libraryapi.application.dto.response;

import java.util.UUID;

public record AuthResponse(
        String token,
        String type,
        UUID userId,
        String name,
        String email
) {
}