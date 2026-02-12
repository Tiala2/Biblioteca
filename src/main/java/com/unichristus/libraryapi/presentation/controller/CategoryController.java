package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.application.dto.response.CategoryResponse;
import com.unichristus.libraryapi.application.usecase.category.CategoryUseCase;
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

import java.util.List;
import java.util.UUID;

@Tag(name = "Categories", description = "Operações com categorias de livros")
@RestController
@RequiredArgsConstructor
@RequestMapping(path = ServiceURI.CATEGORIES_RESOURCE)
public class CategoryController {

    private final CategoryUseCase categoryUseCase;

    @Operation(summary = "Listar todas as categorias ativas", description = "Lista todas as categorias que estão ativas no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de categorias retornada com sucesso")
    })
    @GetMapping
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryUseCase.getAllActiveCategories();
    }

    @Operation(summary = "Obter detalhes de uma categoria", description = "Retorna os detalhes de uma categoria específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria encontrada"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    @GetMapping("/{categoryId}")
    public CategoryResponse getCategoryById(@PathVariable UUID categoryId) {
        return categoryUseCase.getCategoryById(categoryId);
    }

    @GetMapping("/{categoryId}/books")
    @Operation(summary = "Listar livros de uma categoria", description = "Retorna todos os livros associados a uma categoria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de livros retornada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    public Page<BookResponse> getBooksByCategory(
            @PathVariable UUID categoryId,
            Pageable pageable
    ) {
        return categoryUseCase.getBooksByCategory(categoryId, pageable);
    }
}