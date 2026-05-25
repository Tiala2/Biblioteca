package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Parametros para importacao de livros de API externa")
public record ExternalBooksImportRequest(
        @Schema(description = "Termo de busca na Open Library", example = "subject:fiction")
        @NotBlank
        String query,

        @Schema(description = "Quantidade de paginas da API para importar", example = "10")
        @NotNull
        @Min(1)
        @Max(20)
        Integer pages,

        @Schema(description = "Quantidade de itens por pagina na API externa", example = "100")
        @NotNull
        @Min(1)
        @Max(100)
        Integer pageSize,

        @Schema(description = "Importar apenas livros com leitor incorporavel via Archive/Open Library", example = "true")
        Boolean readableOnly,

        @Schema(description = "Quantidade alvo de livros importados antes de parar", example = "100")
        @Min(1)
        @Max(500)
        Integer targetImportCount
) {
    public ExternalBooksImportRequest(String query, Integer pages, Integer pageSize) {
        this(query, pages, pageSize, false, null);
    }

    public boolean shouldImportReadableOnly() {
        return Boolean.TRUE.equals(readableOnly);
    }

    public int resolvedTargetImportCount() {
        return targetImportCount == null ? Integer.MAX_VALUE : targetImportCount;
    }
}
