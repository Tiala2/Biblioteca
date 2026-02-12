package com.unichristus.libraryapi.infrastructure.persistence.review;

import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.review.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewJpaRepository extends JpaRepository<Review, UUID> {

    Page<Review> findReviewByUserId(UUID userId, Pageable pageable);

    @Query("""
            SELECT new com.unichristus.libraryapi.domain.review.BookAverageRating(
                r.book.id,
                AVG(CAST(r.rating AS double)),
                COUNT(r)
            )
            FROM Review r
            WHERE r.book.id IN :bookIds
            GROUP BY r.book.id, r.book.title
            """)
    List<BookAverageRating> getAverageReviewsByBookIds(@Param("bookIds") List<UUID> bookIds);

    @Query("""
            SELECT new com.unichristus.libraryapi.domain.review.BookAverageRating(
                r.book.id,
                AVG(CAST(r.rating AS double)),
                COUNT(r)
            )
            FROM Review r
            WHERE r.book.id = :bookId
            GROUP BY r.book.id, r.book.title
            """)
    Optional<BookAverageRating> getAverageReviewsByBookId(@Param("bookId") UUID bookId);

    Optional<Review> findByUserIdAndBookId(UUID userId, UUID bookId);

}
