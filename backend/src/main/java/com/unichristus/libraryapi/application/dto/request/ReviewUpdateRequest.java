package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para criar uma avaliação")
public record ReviewUpdateRequest(
        @NotNull
        @Min(1)
        @Max(5)
        @Schema(description = "Nota de 1 a 5", example = "5")
        Integer rating,

        @Size(min = 3, max = 1000)
        @Schema(description = "Comentário sobre o livro (opcional)", example = "Excelente livro, recomendo!", nullable = true)
        String comment
) {
}