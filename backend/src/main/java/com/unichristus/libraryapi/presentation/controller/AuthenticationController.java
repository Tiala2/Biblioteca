package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.ForgotPasswordRequest;
import com.unichristus.libraryapi.application.dto.request.LoginRequest;
import com.unichristus.libraryapi.application.dto.request.ResetPasswordRequest;
import com.unichristus.libraryapi.application.dto.response.AuthResponse;
import com.unichristus.libraryapi.application.usecase.auth.AuthenticationUseCase;
import com.unichristus.libraryapi.application.usecase.auth.ForgotPasswordUseCase;
import com.unichristus.libraryapi.application.usecase.auth.ResetPasswordUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autenticação", description = "Autenticação de usuários")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.AUTH_RESOURCE)
public class AuthenticationController {

    private final AuthenticationUseCase authenticationUseCase;
    private final ForgotPasswordUseCase forgotPasswordUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;

    @Operation(summary = "Login de usuário", description = "Realiza o login de um usuário existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {
        return authenticationUseCase.login(request);
    }

    @Operation(summary = "Esqueci minha senha", description = "Dispara email de recuperacao de senha quando o email existe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Solicitacao recebida"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        forgotPasswordUseCase.sendRecoveryEmail(request.email());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Redefinir senha", description = "Redefine a senha com token de recuperacao valido")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Senha redefinida com sucesso"),
            @ApiResponse(responseCode = "400", description = "Token invalido/expirado ou dados invalidos")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        resetPasswordUseCase.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}
