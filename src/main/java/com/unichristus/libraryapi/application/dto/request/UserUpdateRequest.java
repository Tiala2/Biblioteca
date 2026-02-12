package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para atualizar um usuário")
public record UserUpdateRequest(
        @Schema(description = "Nome do usuário", example = "João da Silva", nullable = true)
        String name,

        @Schema(description = "Email do usuário", example = "user@email.com", nullable = true)
        @Email
        String email,

        @Schema(description = "Senha do usuário", example = "strongPassword123", nullable = true)
        @Size(min = 6, max = 64)
        String password
) {
}