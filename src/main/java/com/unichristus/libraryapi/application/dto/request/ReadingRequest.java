package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

@Schema(description = "Dados para criar/atualizar uma leitura")
public record ReadingRequest(
        @NotNull
        @Schema(description = "ID do livro lido", example = "123e4567-e89b-12d3-a456-426614174000")
        UUID bookId,

        @NotNull
        @Positive
        @Schema(description = "Página atual da leitura", example = "150")
        Integer currentPage
) {
}