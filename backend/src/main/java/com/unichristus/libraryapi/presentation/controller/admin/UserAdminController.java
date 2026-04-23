package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.UserUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.application.usecase.user.UserUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "[Admin]", description = "Operações administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.ADMIN_USERS)
public class UserAdminController {

    private final UserUseCase userUseCase;

    @Operation(summary = "Buscar usuário por ID (admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuário encontrado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @GetMapping("/{userId}")
    public UserResponse getUserById(@PathVariable UUID userId) {
        return userUseCase.getUserById(userId);
    }

    @Operation(summary = "Listar usuários (admin) paginado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de usuários retornada com sucesso")
    })
    @GetMapping
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userUseCase.getAllUsers(pageable);
    }

    @Operation(summary = "Invalidar usuário por ID (admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Usuário invalidado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @PutMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateUser(@PathVariable UUID userId, @RequestBody @Valid UserUpdateRequest request) {
        userUseCase.updateUser(userId, request);
    }

    @PatchMapping("/{userId}/reactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reactivateUser(@PathVariable UUID userId) {
        userUseCase.reactivateUser(userId);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void invalidateUser(@PathVariable UUID userId) {
        userUseCase.invalidateUser(userId);
    }
}
