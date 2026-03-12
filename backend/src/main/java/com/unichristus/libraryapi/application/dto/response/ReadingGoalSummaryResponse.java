package com.unichristus.libraryapi.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Resumo de meta de leitura, streak e alertas")
public record ReadingGoalSummaryResponse(
        ReadingGoalResponse goal,
        int streakDays,
        List<AlertResponse> alerts
) {
}
