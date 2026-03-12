package com.unichristus.libraryapi.application.dto.response;

public record AdminMetricsResponse(
        long totalUsers,
        long totalBooks,
        long totalReviews,
        long totalFavorites,
        long totalCollections,
        long totalTags
) {
}
