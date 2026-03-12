package com.unichristus.libraryapi.application.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Schema(description = "Dados para criar um novo livro")
public record BookCreateRequest(
        @Schema(description = "Título do livro", example = "O Senhor dos Anéis")
        @NotBlank
        String title,

        @Schema(description = "ISBN do livro", example = "9783161484100")
        @NotBlank
        String isbn,

        @Schema(description = "Número de páginas do livro", example = "536")
        @NotNull
        @Positive
        Integer numberOfPages,

        @Schema(description = "Data de publicação do livro", example = "1954-07-29")
        @NotNull
        @Past
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate publicationDate,

        @Schema(description = "URL da capa do livro", example = "https://exemplo.com/capas/senhor-dos-aneis.jpg", nullable = true)
        String coverUrl,

        @Schema(description = "IDs das categorias do livro", example = "[\"123e4567-e89b-12d3-a456-426614174000\"]", nullable = true)
        List<UUID> categories
) {
}
