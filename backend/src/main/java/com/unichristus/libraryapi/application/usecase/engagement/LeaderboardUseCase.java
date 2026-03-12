package com.unichristus.libraryapi.application.usecase.engagement;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.LeaderboardEntryResponse;
import com.unichristus.libraryapi.domain.engagement.LeaderboardEntry;
import com.unichristus.libraryapi.domain.engagement.LeaderboardService;
import com.unichristus.libraryapi.domain.engagement.LeaderboardMetric;
import lombok.RequiredArgsConstructor;

import java.util.List;

@UseCase
@RequiredArgsConstructor
public class LeaderboardUseCase {

    private final LeaderboardService leaderboardService;

    public List<LeaderboardEntryResponse> weekly(int limit, LeaderboardMetric metric) {
        return leaderboardService.weeklyLeaderboard(limit, metric)
                .stream()
                .map(entry -> toResponse(entry, metric))
                .toList();
    }

    private LeaderboardEntryResponse toResponse(LeaderboardEntry entry, LeaderboardMetric metric) {
        return new LeaderboardEntryResponse(entry.userId(), entry.userName(), entry.value(), metric.name());
    }
}
