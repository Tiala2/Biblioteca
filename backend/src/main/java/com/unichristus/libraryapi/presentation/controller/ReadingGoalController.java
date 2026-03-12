package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.ReadingGoalRequest;
import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingGoalResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingGoalSummaryResponse;
import com.unichristus.libraryapi.application.dto.response.StreakResponse;
import com.unichristus.libraryapi.application.usecase.reading.ReadingGoalUseCase;
import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Reading Goals", description = "Metas e streak de leitura")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.USERS_RESOURCE + "/me")
public class ReadingGoalController {

    private final ReadingGoalUseCase readingGoalUseCase;

    @Operation(summary = "Definir/atualizar meta de leitura")
    @ApiResponse(responseCode = "200", description = "Meta salva")
    @PutMapping("/goals")
    public ResponseEntity<ReadingGoalResponse> upsertGoal(
            @LoggedUser UUID userId,
            @RequestBody @Valid ReadingGoalRequest request
    ) {
        return ResponseEntity.ok(readingGoalUseCase.upsertGoal(userId, request));
    }

    @Operation(summary = "Obter meta atual")
    @ApiResponse(responseCode = "200", description = "Meta retornada ou null")
    @GetMapping("/goals")
    public ResponseEntity<ReadingGoalResponse> getGoal(
            @LoggedUser UUID userId,
            @RequestParam(defaultValue = "MONTHLY") GoalPeriod period
    ) {
        return ResponseEntity.ok(readingGoalUseCase.getCurrentGoal(userId, period));
    }

    @Operation(summary = "Resumo da meta atual com streak")
    @ApiResponse(responseCode = "200", description = "Resumo retornado")
    @GetMapping("/goals/summary")
    public ResponseEntity<ReadingGoalSummaryResponse> getGoalSummary(
            @LoggedUser UUID userId,
            @RequestParam(defaultValue = "MONTHLY") GoalPeriod period
    ) {
        return ResponseEntity.ok(readingGoalUseCase.getGoalSummary(userId, period));
    }

    @Operation(summary = "Alertas internos relacionados à leitura/meta")
    @ApiResponse(responseCode = "200", description = "Lista de alertas")
    @GetMapping("/alerts")
    public ResponseEntity<java.util.List<AlertResponse>> getAlerts(
            @LoggedUser UUID userId,
            @RequestParam(defaultValue = "MONTHLY") GoalPeriod period
    ) {
        return ResponseEntity.ok(readingGoalUseCase.listAlerts(userId, period));
    }

    @Operation(summary = "Streak de leitura (dias seguidos)")
    @ApiResponse(responseCode = "200", description = "Streak atual")
    @GetMapping("/streak")
    public ResponseEntity<StreakResponse> getStreak(
            @LoggedUser UUID userId
    ) {
        return ResponseEntity.ok(readingGoalUseCase.getStreak(userId));
    }
}
