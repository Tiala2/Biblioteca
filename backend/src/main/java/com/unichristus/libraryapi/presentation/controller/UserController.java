package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.UserRegisterRequest;
import com.unichristus.libraryapi.application.dto.request.UserUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.BadgeResponse;
import com.unichristus.libraryapi.application.dto.response.UserResponse;
import com.unichristus.libraryapi.application.usecase.user.UserUseCase;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.PageableSanitizer;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Set;
import java.util.UUID;

@Tag(name = "Users", description = "Operações com usuário autenticado")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.USERS_RESOURCE)
public class UserController {

    private static final Sort USER_BADGES_DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "awardedAt");
    private static final Set<String> USER_BADGES_ALLOWED_SORTS = Set.of("awardedAt");

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

        @Operation(summary = "Listar badges do usuário", description = "Retorna badges do usuário autenticado, paginados")
        @ApiResponse(responseCode = "200", description = "Badges retornados com sucesso")
        @GetMapping("/me/badges")
        public Page<BadgeResponse> getMyBadges(
                        @LoggedUser UUID userId,
                        Pageable pageable
        ) {
                Pageable safePageable = PageableSanitizer.sanitize(pageable, USER_BADGES_DEFAULT_SORT, USER_BADGES_ALLOWED_SORTS);
                return userUseCase.getBadges(userId, safePageable);
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
