package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Dados para login do usuário")
public record LoginRequest(
        @Schema(description = "Email do usuário", example = "user@email.com")
        @NotBlank
        @Email
        String email,

        @Schema(description = "Senha do usuário")
        @NotBlank
        String password
) {
}
