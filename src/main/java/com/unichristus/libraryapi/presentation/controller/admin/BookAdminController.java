package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.request.BookCreateRequest;
import com.unichristus.libraryapi.application.dto.request.BookUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.application.usecase.book.BookPdfUseCase;
import com.unichristus.libraryapi.application.usecase.book.BookUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Tag(name = "[Admin]", description = "Operações administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.BOOKS_ADMIN)
public class BookAdminController {

    private final BookPdfUseCase bookPdfUseCase;
    private final BookUseCase bookUseCase;

    @Operation(summary = "Criar um novo livro", description = "Cria um novo livro no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Livro criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Acesso proibido"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    //TODO: Adicionar CreatedResource para retornar o Location do recurso criado
    public BookResponse createBook(@RequestBody @Valid BookCreateRequest request) {
        return bookUseCase.createBook(request);
    }

    @Operation(summary = "Atualizar um livro", description = "Atualiza as informações de um livro existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Livro atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Acesso proibido"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    })
    //TODO: receber entidade completa e atualizar todos os campos?
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("{bookId}")
    public void updateBook(@PathVariable UUID bookId, @RequestBody BookUpdateRequest request) {
        bookUseCase.updateBook(bookId, request);
    }

    @Operation(summary = "Fazer upload do PDF de um livro", description = "Faz o upload do arquivo PDF para o livro especificado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "PDF enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo inválido"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Acesso proibido"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado")
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping(path = "/{bookId}/upload", consumes = {"multipart/form-data"})
    public void uploadBook(@PathVariable UUID bookId, @RequestParam("file") MultipartFile file) {
        bookPdfUseCase.uploadBookPdf(bookId, file);
    }

    @Operation(summary = "Deletar um livro", description = "Delete lõgico de um livro existente do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Livro deletado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Acesso proibido"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado")
    })
    @DeleteMapping("{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void invalidateBook(@PathVariable UUID bookId) {
        bookUseCase.invalidateBook(bookId);
    }
}