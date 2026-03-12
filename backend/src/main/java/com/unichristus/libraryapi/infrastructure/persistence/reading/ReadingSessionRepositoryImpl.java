package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.reading.ReadingSession;
import com.unichristus.libraryapi.domain.engagement.LeaderboardEntry;
import com.unichristus.libraryapi.domain.reading.ReadingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ReadingSessionRepositoryImpl implements ReadingSessionRepository {

    private final ReadingSessionJpaRepository repository;

    @Override
    public ReadingSession save(ReadingSession session) {
        return repository.save(session);
    }

    @Override
    public List<ReadingSession> findByUserOrdered(UUID userId) {
        return repository.findByUserIdOrderByLoggedAtDesc(userId);
    }

    @Override
    public List<ReadingSession> findByUserAfter(UUID userId, LocalDateTime after) {
        return repository.findByUserIdAndLoggedAtAfterOrderByLoggedAtDesc(userId, after);
    }

    @Override
    public int sumPagesByUserBetween(UUID userId, LocalDateTime startInclusive, LocalDateTime endExclusive) {
        Integer value = repository.sumPagesByUserBetween(userId, startInclusive, endExclusive);
        return value == null ? 0 : value;
    }

    @Override
    public int sumPagesByUser(UUID userId) {
        Integer value = repository.sumPagesByUser(userId);
        return value == null ? 0 : value;
    }

    @Override
    public List<LeaderboardEntry> findLeaderboard(LocalDateTime after, int limit) {
        return repository.findLeaderboard(after, PageRequest.of(0, limit));
    }
}
