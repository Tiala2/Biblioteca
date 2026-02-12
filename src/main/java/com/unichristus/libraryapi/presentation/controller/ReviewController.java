package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.ReviewCreateRequest;
import com.unichristus.libraryapi.application.dto.request.ReviewUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.ReviewResponse;
import com.unichristus.libraryapi.application.usecase.review.ReviewUseCase;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Reviews", description = "Operações com avaliações de livros")
@RestController
@RequiredArgsConstructor
@RequestMapping(path = ServiceURI.REVIEWS_RESOURCE)
public class ReviewController {

    private final ReviewUseCase reviewUseCase;

    @Operation(summary = "Listar minhas avaliações", description = "Lista todas as avaliações do usuário logado com paginação")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliações do usuário retornada com sucesso")
    })
    @GetMapping("/me")
    public Page<ReviewResponse> getMyReviews(
            @LoggedUser UUID userId,
            Pageable pageable
    ) {
        return reviewUseCase.getUserReviews(userId, pageable);
    }

    @Operation(summary = "Listar avaliações", description = "Lista todas as avaliações com paginação e filtros opcionais")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliações retornada com sucesso")
    })
    @GetMapping
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewUseCase.findReviews(pageable);
    }

    @Operation(summary = "Obter detalhes de uma avaliação específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação encontrada"),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada")
    })
    @GetMapping("/{reviewId}")
    public ReviewResponse getReviewById(@PathVariable UUID reviewId) {
        return reviewUseCase.getReviewById(reviewId);
    }

    @Operation(summary = "Criar uma nova avaliação de livro", description = "Cria uma avaliação para um livro pelo usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Avaliação criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
            @ApiResponse(responseCode = "409", description = "Usuário já avaliou este livro")
    })
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @RequestBody @Valid ReviewCreateRequest request,
            @LoggedUser UUID userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewUseCase.createReview(userId, request));
    }

    @Operation(summary = "Atualizar uma avaliação existente", description = "Atualiza uma avaliação do usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Usuário não tem permissão para atualizar esta avaliação"),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada")
    })
    @PatchMapping("/{reviewId}")
    public ReviewResponse updateReview(
            @PathVariable UUID reviewId,
            @RequestBody @Valid ReviewUpdateRequest request,
            @LoggedUser UUID userId
    ) {
        return reviewUseCase.updateReview(reviewId, userId, request);
    }

    @Operation(summary = "Remover uma avaliação de livro", description = "Remove uma avaliação do usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Avaliação removida com sucesso"),
            @ApiResponse(responseCode = "403", description = "Usuário não tem permissão para remover esta avaliação"),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada")
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{reviewId}")
    public void deleteReview(
            @PathVariable UUID reviewId,
            @LoggedUser UUID userId
    ) {
        reviewUseCase.deleteReview(reviewId, userId);
    }
}