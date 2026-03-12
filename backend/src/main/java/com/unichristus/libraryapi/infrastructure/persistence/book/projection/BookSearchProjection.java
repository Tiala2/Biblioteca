package com.unichristus.libraryapi.infrastructure.persistence.book.projection;

import java.util.UUID;

public interface BookSearchProjection {
    UUID getBookId();
    double getAverageRating();
    long getTotalReviews();
    int getWeeklyReads();
}
