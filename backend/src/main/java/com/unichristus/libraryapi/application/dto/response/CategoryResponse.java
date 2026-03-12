package com.unichristus.libraryapi.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "Dados de uma categoria")
public record CategoryResponse(
        @Schema(description = "ID da categoria")
        UUID id,

        @Schema(description = "Nome da categoria")
        String name,

        @Schema(description = "Descrição da categoria")
        String description,

        @Schema(description = "Se a categoria está ativa")
        Boolean isActive,

        @Schema(description = "Data de criação")
        LocalDateTime createdAt,

        @Schema(description = "Data da última atualização")
        LocalDateTime updatedAt
) {
}