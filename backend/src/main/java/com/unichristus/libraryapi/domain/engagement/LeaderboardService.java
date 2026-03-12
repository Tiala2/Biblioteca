package com.unichristus.libraryapi.domain.engagement;

import com.unichristus.libraryapi.domain.reading.ReadingSessionRepository;
import com.unichristus.libraryapi.domain.reading.ReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final ReadingSessionRepository readingSessionRepository;
    private final ReadingRepository readingRepository;

    public List<LeaderboardEntry> weeklyLeaderboard(int limit, LeaderboardMetric metric) {
        LocalDate startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDateTime start = startOfWeek.atStartOfDay();
        return switch (metric) {
            case PAGES -> readingSessionRepository.findLeaderboard(start, limit);
            case BOOKS -> readingRepository.findFinishedLeaderboard(start, limit);
        };
    }
}
