package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.BadgeUpsertRequest;
import com.unichristus.libraryapi.application.dto.response.BadgeDefinitionResponse;
import com.unichristus.libraryapi.application.usecase.engagement.BadgeAdminUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Badges Admin", description = "Gestão de catálogo de badges (ADMIN)")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.BADGES_ADMIN)
public class BadgeAdminController {

    private final BadgeAdminUseCase badgeAdminUseCase;

    @Operation(summary = "Listar badges")
    @ApiResponse(responseCode = "200", description = "Lista retornada")
    @GetMapping
    public Page<BadgeDefinitionResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "code") String sort
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(sort).ascending());
        return badgeAdminUseCase.list(pageable);
    }

    @Operation(summary = "Criar badge")
    @ApiResponse(responseCode = "201", description = "Badge criada")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public BadgeDefinitionResponse create(@Valid @RequestBody BadgeUpsertRequest request) {
        return badgeAdminUseCase.create(request);
    }

    @Operation(summary = "Atualizar badge")
    @ApiResponse(responseCode = "200", description = "Badge atualizada")
    @PutMapping("/{id}")
    public BadgeDefinitionResponse update(@PathVariable UUID id, @Valid @RequestBody BadgeUpsertRequest request) {
        return badgeAdminUseCase.update(id, request);
    }

    @Operation(summary = "Excluir badge")
    @ApiResponse(responseCode = "204", description = "Badge removida")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        badgeAdminUseCase.delete(id);
    }
}
