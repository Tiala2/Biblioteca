package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para criar ou atualizar uma tag")
public record TagRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "Nome da tag", example = "Fantasia")
        String name
) {
}
