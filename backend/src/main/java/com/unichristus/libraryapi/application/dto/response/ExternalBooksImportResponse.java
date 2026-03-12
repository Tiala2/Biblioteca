package com.unichristus.libraryapi.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Resultado da importação de livros de API externa")
public record ExternalBooksImportResponse(
        @Schema(description = "Quantidade total de registros lidos da API")
        int fetched,

        @Schema(description = "Quantidade de livros importados no banco")
        int imported,

        @Schema(description = "Quantidade de registros pulados por validação ou duplicidade")
        int skipped,

        @Schema(description = "Quantidade de falhas inesperadas")
        int failed,

        @Schema(description = "Mensagens de processamento (limitadas)")
        List<String> messages
) {
}
