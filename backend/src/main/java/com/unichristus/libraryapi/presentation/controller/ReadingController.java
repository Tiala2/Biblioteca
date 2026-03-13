package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.ReadingRequest;
import com.unichristus.libraryapi.application.dto.response.ReadingNarrativeInsightResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingResponse;
import com.unichristus.libraryapi.application.usecase.reading.ReadingNarrativeInsightUseCase;
import com.unichristus.libraryapi.application.usecase.reading.ReadingUseCase;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Readings", description = "Gerenciamento de leituras")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.READINGS_RESOURCE)
public class ReadingController {

    private final ReadingUseCase readingUseCase;
    private final ReadingNarrativeInsightUseCase readingNarrativeInsightUseCase;

    @Operation(summary = "Sincronizar leitura", description = "Sincroniza o progresso de leitura de um livro para o usuario logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Leitura atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "404", description = "Esse livro nao tem pdf disponivel"),
            @ApiResponse(responseCode = "404", description = "Livro nao encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuario nao encontrado"),
    })
    @PostMapping
    public ResponseEntity<ReadingResponse> syncReading(
            @RequestBody @Valid ReadingRequest request,
            @LoggedUser UUID userId
    ) {
        return ResponseEntity.ok(readingUseCase.syncReading(userId, request.bookId(), request.currentPage()));
    }

    @Operation(summary = "Obter estado da trama", description = "Retorna beat narrativo, personagens conhecidos, quizzes e conquistas para a pagina atual")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Insights narrativos retornados com sucesso"),
            @ApiResponse(responseCode = "400", description = "Pagina atual invalida"),
            @ApiResponse(responseCode = "404", description = "Livro ou usuario nao encontrado")
    })
    @GetMapping("/{bookId}/narrative")
    public ResponseEntity<ReadingNarrativeInsightResponse> getNarrativeInsight(
            @PathVariable UUID bookId,
            @RequestParam Integer currentPage,
            @LoggedUser UUID userId
    ) {
        return ResponseEntity.ok(readingNarrativeInsightUseCase.getInsight(userId, bookId, currentPage));
    }
}
