package com.unichristus.libraryapi.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para registro de um novo usuário")
public record UserRegisterRequest(
        @NotBlank
        @Size(min = 3, max = 100)
        @Schema(description = "Nome do usuário", example = "User")
        String name,

        @NotBlank
        @Email
        @Size(min = 5, max = 255)
        @Schema(description = "Email do usuário", example = "user@email.com")
        String email,

        @NotBlank
        @Size(min = 6, max = 64)
//        @Pattern(
//                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,64}$",
//                message = "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&), e não pode ter espaços em branco"
//        )
        @Schema(description = "Senha do usuário", example = "strongPassword123")
        String password
) {
}