package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingJpaRepository extends JpaRepository<Reading, UUID> {

    @Query("""
            SELECT r FROM Reading r
            WHERE r.user.id = :userid
            ORDER BY r.lastReadedAt DESC
            """)
    List<Reading> findReadingsByUserOrderByLastReadedAtDesc(UUID userid);

    boolean existsByUserIdAndBookAndStatus(UUID userId, Book book, ReadingStatus status);

    @Query("""
            SELECT r
            FROM Reading r
            WHERE r.user.id = :userId
              AND r.book = :book
              AND r.status = :status
            """)
    Optional<Reading> findReadingByUserAndBookAndStatus(
            @Param("userId") UUID userId,
            @Param("book") Book book,
            @Param("status") ReadingStatus status
    );
}
