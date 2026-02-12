package com.unichristus.libraryapi.domain.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository {

    Review save(Review review);

    Optional<Review> findById(UUID id);

    Page<Review> findAll(Pageable pageable);

    void delete(Review review);

    Optional<BookAverageRating> getAverageReviewsByBookId(UUID bookId);

    List<BookAverageRating> getAverageReviewsByBookIds(List<UUID> bookIds);

    Optional<Review> findByUserIdAndBookId(UUID userId, UUID bookId);

    Page<Review> findByUserId(UUID userId, Pageable pageable);

}
