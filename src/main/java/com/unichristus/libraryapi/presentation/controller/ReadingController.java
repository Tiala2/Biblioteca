package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.request.ReadingRequest;
import com.unichristus.libraryapi.application.dto.response.ReadingResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Readings", description = "Gerenciamento de leituras")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.READINGS_RESOURCE)
public class ReadingController {

    private final ReadingUseCase readingUseCase;

    @Operation(summary = "Sincronizar leitura", description = "Sincroniza o progresso de leitura de um livro para o usuário logado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Leitura atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Esse livro não tem pdf disponível"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
    })
    @PostMapping
    public ResponseEntity<ReadingResponse> syncReading(
            @RequestBody @Valid ReadingRequest request,
            @LoggedUser UUID userId
    ) {
        return ResponseEntity.ok(readingUseCase.syncReading(userId, request.bookId(), request.currentPage()));
    }
}
