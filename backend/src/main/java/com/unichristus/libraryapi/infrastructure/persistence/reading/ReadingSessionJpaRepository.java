package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.reading.ReadingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReadingSessionJpaRepository extends JpaRepository<ReadingSession, UUID> {

    List<ReadingSession> findByUserIdOrderByLoggedAtDesc(UUID userId);

    List<ReadingSession> findByUserIdAndLoggedAtAfterOrderByLoggedAtDesc(UUID userId, LocalDateTime after);

    @Query("""
            SELECT COALESCE(SUM(rs.pagesRead), 0)
            FROM ReadingSession rs
            WHERE rs.user.id = :userId
                AND rs.loggedAt >= :startInclusive
                AND rs.loggedAt < :endExclusive
            """)
    Integer sumPagesByUserBetween(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("startInclusive") LocalDateTime startInclusive,
        @org.springframework.data.repository.query.Param("endExclusive") LocalDateTime endExclusive
    );

    @Query("""
            SELECT new com.unichristus.libraryapi.domain.engagement.LeaderboardEntry(
                    rs.user.id,
                    rs.user.name,
                    SUM(rs.pagesRead)
            )
            FROM ReadingSession rs
            WHERE rs.loggedAt >= :after
                AND rs.user.leaderboardOptIn = TRUE
            GROUP BY rs.user.id, rs.user.name
            ORDER BY SUM(rs.pagesRead) DESC
            """)
    List<com.unichristus.libraryapi.domain.engagement.LeaderboardEntry> findLeaderboard(
        @org.springframework.data.repository.query.Param("after") LocalDateTime after,
        Pageable pageable
    );

            @Query("""
                SELECT COALESCE(SUM(rs.pagesRead), 0)
                FROM ReadingSession rs
                WHERE rs.user.id = :userId
                """)
            Integer sumPagesByUser(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
