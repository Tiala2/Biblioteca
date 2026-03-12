package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

@Schema(description = "Dados para criar ou atualizar uma coleção")
public record CollectionUpsertRequest(
        @NotBlank
        @Size(max = 120)
        @Schema(description = "Título da coleção", example = "Clássicos brasileiros")
        String title,

        @Size(max = 500)
        @Schema(description = "Descrição da coleção", nullable = true, example = "Seleção de obras clássicas")
        String description,

        @Size(max = 512)
        @Schema(description = "URL da capa da coleção", nullable = true, example = "https://cdn.exemplo.com/capas/classicos.jpg")
        String coverUrl,

        @NotNull
        @Schema(description = "IDs de livros que pertencem à coleção")
        List<UUID> bookIds
) {
}
