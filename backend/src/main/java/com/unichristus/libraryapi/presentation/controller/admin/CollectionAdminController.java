package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.CollectionUpsertRequest;
import com.unichristus.libraryapi.application.dto.response.CollectionResponse;
import com.unichristus.libraryapi.application.usecase.collection.CollectionAdminUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "[Admin]", description = "Operações administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.COLLECTIONS_ADMIN)
public class CollectionAdminController {

    private final CollectionAdminUseCase collectionAdminUseCase;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar coleção", description = "Cria uma nova coleção")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Coleção criada"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado")
    })
    public CollectionResponse createCollection(@RequestBody @Valid CollectionUpsertRequest request) {
        return collectionAdminUseCase.createCollection(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar coleção", description = "Atualiza uma coleção existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleção atualizada"),
            @ApiResponse(responseCode = "404", description = "Coleção ou livro não encontrado")
    })
    public CollectionResponse updateCollection(@PathVariable UUID id,
                                               @RequestBody @Valid CollectionUpsertRequest request) {
        return collectionAdminUseCase.updateCollection(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover coleção", description = "Remove uma coleção")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Coleção removida"),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada")
    })
    public void deleteCollection(@PathVariable UUID id) {
        collectionAdminUseCase.deleteCollection(id);
    }
}
