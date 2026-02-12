package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

@Schema(description = "Dados para criar uma avaliação")
public record ReviewCreateRequest(
        @NotNull
        @Schema(description = "ID do livro a ser avaliado", example = "123e4567-e89b-12d3-a456-426614174000")
        UUID bookId,

        @NotNull
        @Min(1)
        @Max(5)
        @Schema(description = "Nota de 1 a 5", example = "5")
        Integer rating,

        @Size(max = 1000)
        @Schema(description = "Comentário sobre o livro (opcional)", example = "Excelente livro, recomendo!", nullable = true)
        String comment
) {
}