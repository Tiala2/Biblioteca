package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.engagement.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingJpaRepository extends JpaRepository<Reading, UUID> {

    @Query("""
            SELECT r FROM Reading r
            WHERE r.user.id = :userid
            ORDER BY r.lastReadedAt DESC
            """)
    List<Reading> findReadingsByUserOrderByLastReadedAtDesc(@Param("userid") UUID userid);

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

    long countByUserIdAndStatus(UUID userId, ReadingStatus status);

    @Query("""
            SELECT new com.unichristus.libraryapi.domain.engagement.LeaderboardEntry(
                r.user.id,
                r.user.name,
                COUNT(r)
            )
            FROM Reading r
            WHERE r.status = com.unichristus.libraryapi.domain.reading.ReadingStatus.FINISHED
              AND r.finishedAt >= :after
              AND r.user.leaderboardOptIn = TRUE
            GROUP BY r.user.id, r.user.name
            ORDER BY COUNT(r) DESC
            """)
    List<LeaderboardEntry> findFinishedLeaderboard(@Param("after") java.time.LocalDateTime after, Pageable pageable);
}
