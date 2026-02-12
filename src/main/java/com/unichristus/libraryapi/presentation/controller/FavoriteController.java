package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.FavoriteBookRequest;
import com.unichristus.libraryapi.application.dto.response.FavoriteResponse;
import com.unichristus.libraryapi.application.usecase.favorite.FavoriteBookUseCase;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Favorites", description = "Operações com livros favoritos")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.FAVORITES_RESOURCE)
public class FavoriteController {

    private final FavoriteBookUseCase favoriteBookUseCase;

    @Operation(summary = "Listar favoritos do usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de favoritos retornada com sucesso")
    })
    @GetMapping
    public List<FavoriteResponse> getUserFavorites(@LoggedUser UUID userId) {
        return favoriteBookUseCase.getUserFavorites(userId);
    }

    @Operation(summary = "Verificar se livro é favorito")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Informacão retornada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
    })
    @GetMapping("/{bookId}")
    public boolean isFavorite(
            @PathVariable UUID bookId,
            @LoggedUser UUID userId
    ) {
        return favoriteBookUseCase.isFavorite(bookId, userId);
    }

    @Operation(summary = "Favoritar livro")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Livro adicionado aos favoritos com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
    })
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public FavoriteResponse favoriteBook(
            @RequestBody @Valid FavoriteBookRequest request,
            @LoggedUser UUID userId
    ) {
        return favoriteBookUseCase.favoriteBook(request.bookId(), userId);
    }

    @Operation(summary = "Remover livro dos favoritos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Livro removido dos favoritos com sucesso"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{bookId}")
    public void unfavoriteBook(
            @PathVariable UUID bookId,
            @LoggedUser UUID userId
    ) {
        favoriteBookUseCase.unfavoriteBook(bookId, userId);
    }
}