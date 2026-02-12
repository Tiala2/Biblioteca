package com.unichristus.libraryapi.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "Dados de uma avaliação de livro")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    @Schema(description = "ID da avaliação")
    private UUID id;

    @Schema(description = "ID do livro avaliado")
    private UUID bookId;

    @Schema(description = "Nota de 1 a 5")
    private Integer rating;

    @Schema(description = "Comentário sobre o livro")
    private String comment;

    @Schema(description = "Data de criação da avaliação")
    private LocalDateTime createdAt;

    @Schema(description = "Data da última atualização")
    private LocalDateTime updatedAt;
}