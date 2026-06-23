package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Parametros para importacao de livros de API externa")
public record ExternalBooksImportRequest(
        @Schema(description = "Termo de busca. Na Open Library pode usar subject:fiction; no Gutenberg use temas como fiction, adventure ou mystery.", example = "fiction")
        @NotBlank
        String query,

        @Schema(description = "Quantidade de paginas da fonte externa para consultar antes de parar", example = "5")
        @NotNull
        @Min(1)
        @Max(20)
        Integer pages,

        @Schema(description = "Quantidade de itens por pagina na API externa. No Gutenberg este valor e mantido por compatibilidade.", example = "100")
        @NotNull
        @Min(1)
        @Max(100)
        Integer pageSize,

        @Schema(description = "Na Open Library importa apenas livros com leitor externo incorporavel. No Gutenberg a leitura interna e sempre priorizada.", example = "true")
        Boolean readableOnly,

        @Schema(description = "Quantidade alvo de livros importados antes de parar", example = "100")
        @Min(1)
        @Max(500)
        Integer targetImportCount,

        @Schema(description = "Idioma preferencial da busca externa. Use pt para português e en para inglês.", example = "pt")
        String language
) {
    public ExternalBooksImportRequest(String query, Integer pages, Integer pageSize) {
        this(query, pages, pageSize, false, null, null);
    }

    public ExternalBooksImportRequest(String query, Integer pages, Integer pageSize, Boolean readableOnly, Integer targetImportCount) {
        this(query, pages, pageSize, readableOnly, targetImportCount, null);
    }

    public boolean shouldImportReadableOnly() {
        return Boolean.TRUE.equals(readableOnly);
    }

    public int resolvedTargetImportCount() {
        return targetImportCount == null ? Integer.MAX_VALUE : targetImportCount;
    }

    public String resolvedLanguage() {
        if (language == null || language.isBlank()) {
            return "en";
        }
        String normalized = language.trim().toLowerCase();
        return normalized.equals("pt") || normalized.equals("por") || normalized.equals("portuguese") ? "pt" : "en";
    }
}
