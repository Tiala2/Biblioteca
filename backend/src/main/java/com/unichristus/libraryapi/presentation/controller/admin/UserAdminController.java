package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.UserUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.application.usecase.user.UserUseCase;
import com.unichristus.libraryapi.domain.user.UserRole;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.PageableSanitizer;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@Tag(name = "[Admin]", description = "Operações administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.ADMIN_USERS)
public class UserAdminController {

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");
    private static final Set<String> ALLOWED_SORTS = Set.of("name", "email", "role", "active", "createdAt", "updatedAt");

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
    public Page<UserResponse> getAllUsers(
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) UserRole role,
            Pageable pageable
    ) {
        Pageable safePageable = PageableSanitizer.sanitize(pageable, DEFAULT_SORT, ALLOWED_SORTS);
        return userUseCase.getAllUsers(query, active, role, safePageable);
    }

    @Operation(summary = "Invalidar usuário por ID (admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Usuário invalidado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @PutMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateUser(
            @LoggedUser UUID actorUserId,
            @PathVariable UUID userId,
            @RequestBody @Valid UserUpdateRequest request
    ) {
        userUseCase.updateUserAsAdmin(actorUserId, userId, request);
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
