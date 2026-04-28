package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.ForgotPasswordRequest;
import com.unichristus.libraryapi.application.dto.request.LoginRequest;
import com.unichristus.libraryapi.application.dto.request.ResetPasswordRequest;
import com.unichristus.libraryapi.application.dto.response.AuthResponse;
import com.unichristus.libraryapi.application.usecase.auth.AuthenticationUseCase;
import com.unichristus.libraryapi.application.usecase.auth.ForgotPasswordUseCase;
import com.unichristus.libraryapi.application.usecase.auth.ResetPasswordUseCase;
import com.unichristus.libraryapi.infrastructure.security.ForgotPasswordRateLimitService;
import com.unichristus.libraryapi.infrastructure.security.LoginRateLimitService;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autenticacao", description = "Autenticacao de usuarios")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.AUTH_RESOURCE)
public class AuthenticationController {

    private static final CacheControl AUTH_CACHE_CONTROL = CacheControl.noStore().mustRevalidate();

    private final AuthenticationUseCase authenticationUseCase;
    private final ForgotPasswordUseCase forgotPasswordUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;
    private final LoginRateLimitService loginRateLimitService;
    private final ForgotPasswordRateLimitService forgotPasswordRateLimitService;

    @Operation(summary = "Login de usuario", description = "Realiza o login de um usuario existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Credenciais invalidas"),
            @ApiResponse(responseCode = "429", description = "Muitas tentativas de login"),
            @ApiResponse(responseCode = "404", description = "Usuario nao encontrado")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request, HttpServletRequest httpRequest) {
        String clientAddress = extractClientAddress(httpRequest);
        loginRateLimitService.checkAllowed(clientAddress);
        try {
            AuthResponse response = authenticationUseCase.login(request);
            loginRateLimitService.reset(clientAddress);
            return noStoreResponse(response);
        } catch (AuthenticationException ex) {
            loginRateLimitService.registerFailure(clientAddress);
            throw ex;
        }
    }

    @Operation(summary = "Esqueci minha senha", description = "Dispara email de recuperacao de senha quando o email existe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Solicitacao recebida"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "429", description = "Muitas solicitacoes de recuperacao")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        forgotPasswordRateLimitService.checkAllowed(extractClientAddress(httpRequest));
        forgotPasswordUseCase.sendRecoveryEmail(request.email(), request.baseUrl());
        return noStoreNoContentResponse();
    }

    @Operation(summary = "Redefinir senha", description = "Redefine a senha com token de recuperacao valido")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Senha redefinida com sucesso"),
            @ApiResponse(responseCode = "400", description = "Token invalido/expirado ou dados invalidos")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        resetPasswordUseCase.resetPassword(request.token(), request.newPassword());
        return noStoreNoContentResponse();
    }

    private ResponseEntity<AuthResponse> noStoreResponse(AuthResponse body) {
        return ResponseEntity.ok()
                .cacheControl(AUTH_CACHE_CONTROL)
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(body);
    }

    private ResponseEntity<Void> noStoreNoContentResponse() {
        return ResponseEntity.noContent()
                .cacheControl(AUTH_CACHE_CONTROL)
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .build();
    }

    private String extractClientAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
