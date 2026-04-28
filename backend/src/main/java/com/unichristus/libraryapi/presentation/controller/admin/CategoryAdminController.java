package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.CategoryRequest;
import com.unichristus.libraryapi.application.dto.response.CategoryResponse;
import com.unichristus.libraryapi.application.usecase.category.CategoryUseCase;
import com.unichristus.libraryapi.presentation.common.CreatedResponses;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "[Admin]", description = "Operacoes administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.CATEGORIES_ADMIN)
public class CategoryAdminController {

    private final CategoryUseCase categoryUseCase;

    @GetMapping
    @Operation(summary = "Listar categorias", description = "Retorna a lista completa de categorias para administracao")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de categorias retornada com sucesso")
    })
    public List<CategoryResponse> getAllCategories() {
        return categoryUseCase.getAllCategories();
    }

    @Operation(summary = "Criar uma nova categoria", description = "Cria uma nova categoria no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Categoria criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "409", description = "Ja existe uma categoria com este nome")
    })
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody @Valid CategoryRequest request) {
        CategoryResponse response = categoryUseCase.createCategory(request);
        return CreatedResponses.createdCurrentResource(response.id(), response);
    }

    @PutMapping("/{categoryId}")
    @Operation(summary = "Atualizar uma categoria", description = "Atualiza os dados de uma categoria existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "404", description = "Categoria nao encontrada"),
            @ApiResponse(responseCode = "409", description = "Ja existe uma categoria com este nome")
    })
    public CategoryResponse updateCategory(
            @PathVariable UUID categoryId,
            @RequestBody @Valid CategoryRequest request
    ) {
        return categoryUseCase.updateCategory(categoryId, request);
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Deleta uma categoria", description = "Deleta uma categoria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Categoria deletada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Categoria nao encontrada")
    })
    public void deleteCategory(@PathVariable UUID categoryId) {
        categoryUseCase.deleteCategory(categoryId);
    }
}
