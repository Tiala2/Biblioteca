package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Parâmetros para importação de livros de API externa")
public record ExternalBooksImportRequest(
        @Schema(description = "Termo de busca na Open Library", example = "programming")
        @NotBlank
        String query,

        @Schema(description = "Quantidade de páginas da API para importar", example = "2")
        @NotNull
        @Min(1)
        @Max(20)
        Integer pages,

        @Schema(description = "Quantidade de itens por página na API externa", example = "50")
        @NotNull
        @Min(1)
        @Max(100)
        Integer pageSize
) {
}
