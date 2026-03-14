package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.book.BookSource;

import java.time.LocalDateTime;
import java.util.UUID;

public record FavoriteResponse(
        UUID bookId,
        String bookTitle,
        String bookIsbn,
        String coverUrl,
        BookSource source,
        LocalDateTime createdAt
) {
}
