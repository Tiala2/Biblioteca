package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.UserRegisterRequest;
import com.unichristus.libraryapi.application.dto.request.UserUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.application.usecase.user.UserUseCase;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@Tag(name = "Users", description = "Operações com usuário autenticado")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.USERS_RESOURCE)
public class UserController {

    private final UserUseCase userUseCase;

    @Operation(summary = "Registrar novo usuário", description = "Registra um novo usuário no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuário cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "409", description = "Usuário já existe")
    })
    @PostMapping()
    public ResponseEntity<UserResponse> register(@RequestBody @Valid UserRegisterRequest request) {
        UserResponse userResponse = userUseCase.register(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(userResponse.getId())
                .toUri();
        return ResponseEntity.created(location).body(userResponse);
    }

    @Operation(summary = "Obter informações do usuário atual", description = "Retorna as informações do usuário autenticado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Informações do usuário retornadas com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @GetMapping("/me")
    public UserResponse getMe(@LoggedUser UUID userId) {
        return userUseCase.getUserById(userId);
    }

    @Operation(summary = "Atualizar informações do usuário atual", description = "Atualiza as informações do usuário autenticado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Informações do usuário atualizadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @PutMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateMe(
            @LoggedUser UUID userId,
            @RequestBody @Valid UserUpdateRequest request
    ) {
        userUseCase.updateUser(userId, request);
    }
}