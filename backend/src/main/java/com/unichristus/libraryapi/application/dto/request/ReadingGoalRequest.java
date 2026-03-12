package com.unichristus.libraryapi.application.dto.request;

import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Configuração de meta de leitura")
public record ReadingGoalRequest(
        @NotNull
        @Schema(example = "MONTHLY")
        GoalPeriod period,

        @NotNull
        @Min(1)
        @Schema(example = "200")
        Integer targetPages
) {
}
