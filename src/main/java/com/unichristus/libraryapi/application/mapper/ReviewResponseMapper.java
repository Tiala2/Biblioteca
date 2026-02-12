package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.ReviewHomeResponse;
import com.unichristus.libraryapi.application.dto.response.ReviewResponse;
import com.unichristus.libraryapi.domain.review.Review;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ReviewResponseMapper {

    public static ReviewResponse toReviewResponse(Review review) {
        if (review == null) return null;
        return ReviewResponse.builder()
                .id(review.getId())
                .bookId(review.getBook().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    public static ReviewHomeResponse toReviewHomeResponse(Review review) {
        if (review == null) return null;
        return new ReviewHomeResponse(
                review.getBook().getTitle(),
                review.getBook().getCoverUrl(),
                review.getRating()
        );
    }
}
