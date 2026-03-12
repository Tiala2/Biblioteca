package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.TagRequest;
import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.application.usecase.tag.TagAdminUseCase;
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

@Tag(name = "[Admin]", description = "Operações administrativas da API")
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
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar tag", description = "Cria uma nova tag")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tag criada com sucesso"),
            @ApiResponse(responseCode = "409", description = "Tag já cadastrada")
    })
    public TagResponse createTag(@RequestBody @Valid TagRequest request) {
        return tagAdminUseCase.createTag(request);
    }

    @PutMapping("/{tagId}")
    @Operation(summary = "Atualizar tag", description = "Atualiza uma tag existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tag atualizada"),
            @ApiResponse(responseCode = "404", description = "Tag não encontrada"),
            @ApiResponse(responseCode = "409", description = "Tag já cadastrada")
    })
    public TagResponse updateTag(@PathVariable UUID tagId, @RequestBody @Valid TagRequest request) {
        return tagAdminUseCase.updateTag(tagId, request);
    }

    @DeleteMapping("/{tagId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remover tag", description = "Remove uma tag")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tag removida"),
            @ApiResponse(responseCode = "404", description = "Tag não encontrada")
    })
    public void deleteTag(@PathVariable UUID tagId) {
        tagAdminUseCase.deleteTag(tagId);
    }
}
