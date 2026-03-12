package com.unichristus.libraryapi.application.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record FavoriteResponse(
        UUID bookId,
        String bookTitle,
        String bookIsbn,
        LocalDateTime createdAt
) {
}
