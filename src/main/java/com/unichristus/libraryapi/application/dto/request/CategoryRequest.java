package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para criar ou atualizar uma categoria")
public record CategoryRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "Nome da categoria", example = "Ficção Científica")
        String name,

        @Size(max = 500)
        @Schema(description = "Descrição da categoria", example = "Livros de ficção científica e futurismo", nullable = true)
        String description
) {
}