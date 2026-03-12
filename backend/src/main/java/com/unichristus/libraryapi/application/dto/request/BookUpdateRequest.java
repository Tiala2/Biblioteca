package com.unichristus.libraryapi.application.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Schema(description = "Dados para atualizar um livro")
public record BookUpdateRequest(

        @Schema(description = "Título do livro", example = "O Senhor dos Anéis", nullable = true)
        String title,

        @Schema(description = "ISBN do livro", example = "9783161484100", nullable = true)
        String isbn,

        @Schema(description = "Número de páginas do livro", example = "536", nullable = true)
        @Positive
        Integer numberOfPages,

        @Schema(description = "Data de publicação do livro", example = "1954-07-29", nullable = true, pattern = "yyyy-MM-dd")
        @Past
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate publicationDate,

        @Schema(description = "Livro disponível", example = "true", nullable = true)
        Boolean available,

        @Schema(description = "IDs das categorias do livro", example = "[\"123e4567-e89b-12d3-a456-426614174000\", \"223e4567-e89b-12d3-a456-426614174001\"]", nullable = true)
        List<UUID> categories
) {
}
