package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.TagRequest;
import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.application.usecase.tag.TagAdminUseCase;
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
@RequestMapping(ServiceURI.TAGS_ADMIN)
public class TagAdminController {

    private final TagAdminUseCase tagAdminUseCase;

    @GetMapping
    @Operation(summary = "Listar tags", description = "Retorna todas as tags cadastradas")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Lista retornada"))
    public List<TagResponse> listTags() {
        return tagAdminUseCase.listTags();
    }

    @PostMapping
    @Operation(summary = "Criar tag", description = "Cria uma nova tag")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tag criada com sucesso"),
            @ApiResponse(responseCode = "409", description = "Tag ja cadastrada")
    })
    public ResponseEntity<TagResponse> createTag(@RequestBody @Valid TagRequest request) {
        TagResponse response = tagAdminUseCase.createTag(request);
        return CreatedResponses.createdCurrentResource(response.id(), response);
    }

    @PutMapping("/{tagId}")
    @Operation(summary = "Atualizar tag", description = "Atualiza uma tag existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tag atualizada"),
            @ApiResponse(responseCode = "404", description = "Tag nao encontrada"),
            @ApiResponse(responseCode = "409", description = "Tag ja cadastrada")
    })
    public TagResponse updateTag(@PathVariable UUID tagId, @RequestBody @Valid TagRequest request) {
        return tagAdminUseCase.updateTag(tagId, request);
    }

    @DeleteMapping("/{tagId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover tag", description = "Remove uma tag")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tag removida"),
            @ApiResponse(responseCode = "404", description = "Tag nao encontrada")
    })
    public void deleteTag(@PathVariable UUID tagId) {
        tagAdminUseCase.deleteTag(tagId);
    }
}
