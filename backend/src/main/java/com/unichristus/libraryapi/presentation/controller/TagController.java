package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.application.usecase.tag.TagUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Tags", description = "Operações com tags de livros")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.TAGS_RESOURCE)
public class TagController {

    private final TagUseCase tagUseCase;

    @GetMapping
    @Operation(summary = "Listar tags", description = "Retorna todas as tags para filtros de busca")
    @ApiResponse(responseCode = "200", description = "Lista retornada")
    public List<TagResponse> listTags() {
        return tagUseCase.listTags();
    }
}
