package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.response.FavoriteResponse;
import com.unichristus.libraryapi.application.usecase.favorite.FavoriteBookUseCase;
import com.unichristus.libraryapi.presentation.common.PageableSanitizer;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@Tag(name = "[Admin]", description = "Operacoes administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.FAVORITES_ADMIN)
public class FavoriteAdminController {

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");
    private static final Set<String> ALLOWED_SORTS = Set.of("createdAt");

    private final FavoriteBookUseCase favoriteBookUseCase;

    @Operation(summary = "Listar todos os favoritos (admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de favoritos retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autorizado"),
            @ApiResponse(responseCode = "403", description = "Acesso proibido")
    })
    @GetMapping
    public Page<FavoriteResponse> getAll(Pageable pageable) {
        Pageable safePageable = PageableSanitizer.sanitize(pageable, DEFAULT_SORT, ALLOWED_SORTS);
        return favoriteBookUseCase.getAll(safePageable);
    }
}
