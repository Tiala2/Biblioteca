package com.unichristus.libraryapi.infrastructure.persistence.review;

import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.review.Review;
import com.unichristus.libraryapi.domain.review.ReviewRepository;
import com.unichristus.libraryapi.domain.review.exception.ReviewAlreadyExists;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ReviewRepositoryImpl implements ReviewRepository {

    private final ReviewJpaRepository reviewJpaRepository;

    @Override
    public Optional<Review> findById(UUID reviewId) {
        return reviewJpaRepository.findById(reviewId);
    }

    @Override
    public Review save(Review review) {
        try {
            return reviewJpaRepository.save(review);
        } catch (DataIntegrityViolationException ex) {
            throw new ReviewAlreadyExists();
        }
    }

    @Override
    public void delete(Review review) {
        reviewJpaRepository.delete(review);
    }

    @Override
    public Page<Review> findByUserId(UUID userId, Pageable pageable) {
        return reviewJpaRepository.findReviewByUserId(userId, pageable);
    }

    @Override
    public Page<Review> findAll(Pageable pageable) {
        pageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return reviewJpaRepository.findAll(pageable);
    }

    @Override
    public Optional<BookAverageRating> getAverageReviewsByBookId(UUID bookId) {
        return reviewJpaRepository.getAverageReviewsByBookId(bookId);
    }

    @Override
    public List<BookAverageRating> getAverageReviewsByBookIds(List<UUID> bookIds) {
        return reviewJpaRepository.getAverageReviewsByBookIds(bookIds);
    }

    @Override
    public List<BookAverageRating> getTopRatedBooks(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return reviewJpaRepository.findTopRatedBooks(pageable);
    }

    @Override
    public Optional<Review> findByUserIdAndBookId(UUID userId, UUID bookId) {
        return reviewJpaRepository.findByUserIdAndBookId(userId, bookId);
    }

    @Override
    public long count() {
        return reviewJpaRepository.count();
    }
}
