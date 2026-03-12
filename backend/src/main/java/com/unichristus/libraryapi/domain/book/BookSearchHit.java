package com.unichristus.libraryapi.domain.book;

import java.util.UUID;

public record BookSearchHit(
        UUID bookId,
        double averageRating,
        long totalReviews,
        int weeklyReads
) {
}
