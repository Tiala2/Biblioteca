package com.unichristus.libraryapi.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Alerta interno para engajamento/leitura")
public record AlertResponse(
        @Schema(example = "GOAL_EXPIRING-MONTHLY-2026-02-01")
        String id,
        @Schema(example = "GOAL_EXPIRING")
        AlertType type,
        @Schema(example = "WARNING")
        AlertSeverity severity,
        @Schema(example = "Sua meta mensal expira em 2 dias")
        String message,
        @Schema(example = "20")
        Integer suggestedDailyPages
) {
}
