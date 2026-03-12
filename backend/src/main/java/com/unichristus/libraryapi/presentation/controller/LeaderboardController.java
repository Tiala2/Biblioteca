package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.LeaderboardEntryResponse;
import com.unichristus.libraryapi.application.usecase.engagement.LeaderboardUseCase;
import com.unichristus.libraryapi.domain.engagement.LeaderboardMetric;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Leaderboard", description = "Ranking semanal de páginas lidas (opt-in)")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.USERS_RESOURCE + "/leaderboard")
public class LeaderboardController {

    private final LeaderboardUseCase leaderboardUseCase;

    @Operation(summary = "Leaderboard semanal por páginas lidas ou livros concluídos")
    @ApiResponse(responseCode = "200", description = "Ranking retornado")
    @GetMapping
    public ResponseEntity<List<LeaderboardEntryResponse>> getWeeklyLeaderboard(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "PAGES") LeaderboardMetric metric
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return ResponseEntity.ok(leaderboardUseCase.weekly(safeLimit, metric));
    }
}
