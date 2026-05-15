package com.unichristus.libraryapi.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @NotBlank(message = "Email e obrigatorio")
        @Email(message = "Email inválido")
        String email,
        @Size(max = 255, message = "baseUrl excede tamanho máximo")
        String baseUrl
) {
}
