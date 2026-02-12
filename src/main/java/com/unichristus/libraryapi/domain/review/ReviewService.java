package com.unichristus.libraryapi.domain.review;

import com.unichristus.libraryapi.domain.review.exception.ReviewNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public Review findByIdOrThrow(UUID reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException(reviewId));
    }

    public Review save(Review review) {
        return reviewRepository.save(review);
    }

    public void delete(Review review) {
        reviewRepository.delete(review);
    }

    public Page<Review> findByUserId(UUID userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable);
    }

    public Page<Review> findAll(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }

    public Optional<Review> findByUserAndBookId(UUID userId, UUID bookId) {
        return reviewRepository.findByUserIdAndBookId(userId, bookId);
    }

    public List<BookAverageRating> getAverageReviewsByBookIds(List<UUID> bookIds) {
        return reviewRepository.getAverageReviewsByBookIds(bookIds);
    }

    public Optional<BookAverageRating> getAverageReviewsByBookId(UUID bookId) {
        return reviewRepository.getAverageReviewsByBookId(bookId);
    }
}

