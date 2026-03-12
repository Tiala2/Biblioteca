package com.unichristus.libraryapi.domain.reading;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.unichristus.libraryapi.domain.engagement.LeaderboardEntry;

public interface ReadingSessionRepository {

    ReadingSession save(ReadingSession session);

    List<ReadingSession> findByUserOrdered(UUID userId);

    List<ReadingSession> findByUserAfter(UUID userId, LocalDateTime after);

    int sumPagesByUserBetween(UUID userId, LocalDateTime startInclusive, LocalDateTime endExclusive);

    int sumPagesByUser(UUID userId);

    List<LeaderboardEntry> findLeaderboard(LocalDateTime after, int limit);
}
