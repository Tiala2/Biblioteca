package com.unichristus.libraryapi.domain.review;

import java.util.UUID;

public record BookAverageRating(
        UUID bookId,
        Double averageRating,
        Long totalReviews
) {
}
