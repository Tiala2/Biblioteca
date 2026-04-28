package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.BookPdfResponse;
import com.unichristus.libraryapi.application.dto.response.BookListResponse;
import com.unichristus.libraryapi.application.usecase.book.BookPdfUseCase;
import com.unichristus.libraryapi.application.usecase.book.BookUseCase;
import com.unichristus.libraryapi.domain.book.BookSort;
import com.unichristus.libraryapi.presentation.common.PageableSanitizer;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Tag(name = "Books", description = "Operações de busca de livros destinada ao usuário")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.BOOKS_RESOURCE)
public class BookController {

    private static final Sort DEFAULT_SORT = Sort.unsorted();

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

    @Operation(summary = "Ler PDF do livro", description = "Retorna o PDF do livro para leitura no navegador ou download")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "PDF não encontrado")
    })
    @GetMapping("{bookId}/pdf")
    public ResponseEntity<InputStreamResource> readBookPdf(
            @PathVariable UUID bookId,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download) {
        var file = bookPdfUseCase.getBookPdfFile(bookId);
        String filename = "book-" + bookId + ".pdf";
        String disposition = (download ? "attachment" : "inline") + "; filename=\"" + filename + "\"";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(MediaType.parseMediaType(file.contentType()))
                .contentLength(file.size())
                .body(new InputStreamResource(file.stream()));
    }

    @Operation(summary = "Listar todos os livros", description = "Retorna uma lista paginada de todos os livros disponíveis")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de livros retornada com sucesso"),
    })
    @GetMapping
    public Page<BookListResponse> getAllBooks(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam(value = "categoryIds", required = false) List<UUID> categoryIds,
            @RequestParam(value = "tagIds", required = false) List<UUID> tagIds,
            @RequestParam(value = "minPages", required = false) Integer minPages,
            @RequestParam(value = "maxPages", required = false) Integer maxPages,
            @RequestParam(value = "publicationFrom", required = false) LocalDate publicationFrom,
            @RequestParam(value = "publicationTo", required = false) LocalDate publicationTo,
            @RequestParam(value = "includeWithoutPdf", required = false, defaultValue = "false") boolean includeWithoutPdf,
            @RequestParam(value = "sort", required = false) BookSort sort,
            Pageable pageable) {
        Pageable safePageable = PageableSanitizer.sanitize(pageable, DEFAULT_SORT, Set.of());
        return bookUseCase.getAllBooks(
                query,
                author,
                categoryIds,
                tagIds,
                minPages,
                maxPages,
                publicationFrom,
                publicationTo,
                includeWithoutPdf,
                sort,
                safePageable);
    }

    @Operation(summary = "Recomendações de livros", description = "Sugestões personalizadas com fallback de mais bem avaliados")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Lista retornada"))
    @GetMapping("/recommendations")
    public List<BookListResponse> getRecommendations(
            @RequestParam(value = "userId", required = false) UUID userId,
            @RequestParam(value = "limit", required = false, defaultValue = "6") int limit) {
        return bookUseCase.getRecommendations(userId, limit);
    }

}
