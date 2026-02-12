package com.unichristus.libraryapi.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Dados de uma categoria")
public record CategoryLowResponse(
        @Schema(description = "ID da categoria")
        UUID id,

        @Schema(description = "Nome da categoria")
        String name,

        @Schema(description = "Descrição da categoria")
        String description
) {
}