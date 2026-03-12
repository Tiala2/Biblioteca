package com.unichristus.libraryapi.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Token e obrigatorio")
        String token,
        @NotBlank(message = "Nova senha e obrigatoria")
        @Size(min = 6, message = "Nova senha deve ter no minimo 6 caracteres")
        String newPassword
) {
}

