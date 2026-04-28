package com.unichristus.libraryapi.application.dto.request;

import com.unichristus.libraryapi.application.validation.SafeHttpUrl;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

@Schema(description = "Dados para criar ou atualizar uma colecao")
public record CollectionUpsertRequest(
        @NotBlank
        @Size(max = 120)
        @Schema(description = "Titulo da colecao", example = "Classicos brasileiros")
        String title,

        @Size(max = 500)
        @Schema(description = "Descricao da colecao", nullable = true, example = "Selecao de obras classicas")
        String description,

        @Size(max = 512)
        @SafeHttpUrl
        @Schema(description = "URL da capa da colecao", nullable = true, example = "https://cdn.exemplo.com/capas/classicos.jpg")
        String coverUrl,

        @NotNull
        @Schema(description = "IDs de livros que pertencem a colecao")
        List<UUID> bookIds
) {
}
