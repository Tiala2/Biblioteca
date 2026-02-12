package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.LoginRequest;
import com.unichristus.libraryapi.application.dto.response.AuthResponse;
import com.unichristus.libraryapi.application.usecase.auth.AuthenticationUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
}
