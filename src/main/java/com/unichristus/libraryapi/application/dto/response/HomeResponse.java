package com.unichristus.libraryapi.application.dto.response;

import java.util.List;

public record HomeResponse(
        UserSummaryResponse userSummary,
        List<ReadingHomeResponse> readings,
        List<ReviewHomeResponse> recentReviews
) {
}
