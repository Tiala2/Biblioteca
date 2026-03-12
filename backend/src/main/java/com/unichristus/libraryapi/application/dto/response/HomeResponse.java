package com.unichristus.libraryapi.application.dto.response;

import java.util.List;

public record HomeResponse(
        UserSummaryResponse userSummary,
        List<ReadingHomeResponse> readings,
        ReadingProgressResponse readingProgress,
        List<CollectionResponse> collections,
        List<BookListResponse> recommendations,
        List<ReviewHomeResponse> recentReviews
) {
}
