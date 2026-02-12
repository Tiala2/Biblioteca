package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.BookPdfResponse;
import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.application.usecase.book.BookPdfUseCase;
import com.unichristus.libraryapi.application.usecase.book.BookUseCase;
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

@Tag(name = "Books", description = "Operações de busca de livros destinada ao usuário")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.BOOKS_RESOURCE)
public class BookController {

    private final BookUseCase bookUseCase;
    private final BookPdfUseCase bookPdfUseCase;

    @Operation(summary = "Obter livro por ID", description = "Retorna os detalhes de um livro específico, incluindo o PDF")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livro encontrado"),
            @ApiResponse(responseCode = "404", description = "Livro não encontrado"),
    })
    @GetMapping("{bookId}")
    public BookPdfResponse getBookById(@PathVariable UUID bookId) {
        return bookPdfUseCase.getBookWithPdf(bookId);
    }

    @Operation(summary = "Listar todos os livros", description = "Retorna uma lista paginada de todos os livros disponíveis")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de livros retornada com sucesso"),
    })
    @GetMapping
    //TODO: Implementar filtros de busca (nome, autor, categoria, etc)
    public Page<BookResponse> getAllBooks(Pageable pageable) {
        return bookUseCase.getAllBooks(pageable);
    }

}
