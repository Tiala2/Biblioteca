package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.CollectionResponse;
import com.unichristus.libraryapi.application.usecase.collection.CollectionUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Collections", description = "Coleções temáticas de livros")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.COLLECTIONS_RESOURCE)
public class CollectionController {

    private final CollectionUseCase collectionUseCase;

    @Operation(summary = "Listar coleções", description = "Retorna coleções paginadas")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Lista retornada"))
    @GetMapping
    public Page<CollectionResponse> listCollections(Pageable pageable) {
        return collectionUseCase.listCollections(pageable);
    }

    @Operation(summary = "Obter coleção", description = "Retorna uma coleção e seus livros")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleção encontrada"),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada")
    })
    @GetMapping("/{id}")
    public CollectionResponse getCollection(@PathVariable UUID id) {
        return collectionUseCase.getCollection(id);
    }
}
