package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.BookPdfResponse;
import com.unichristus.libraryapi.application.mapper.BookResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.book.exception.BookPdfNotFoundException;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.review.ReviewService;
import com.unichristus.libraryapi.infrastructure.storage.MinioFileStorageService;
import com.unichristus.libraryapi.infrastructure.storage.exception.FileStorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@UseCase
@RequiredArgsConstructor
public class BookPdfUseCase {

    private final BookService bookService;
    private final ReviewService reviewService;
    private final MinioFileStorageService minioFileStorageService;

    public BookPdfResponse getBookWithPdf(UUID bookId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        BookAverageRating bookAverageRating = reviewService.getAverageReviewsByBookId(bookId).orElse(null);
        return BookResponseMapper.toBookPdfResponse(book, getBookPdfUrl(book), bookAverageRating);
    }

    public String getBookPdfUrl(Book book) {
        if (!book.isHasPdf()) {
            return null;
        }
        try {
            return minioFileStorageService.generatePresignedUrl(book.getId().toString());
        } catch (RuntimeException ex) {
            // Do not break book details when object storage is temporarily unavailable.
            log.warn("Falha ao gerar URL de PDF para livro {}: {}", book.getId(), ex.getMessage());
            return null;
        }
    }

    public void uploadBookPdf(UUID bookId, MultipartFile file) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        minioFileStorageService.uploadPdf(file, book.getId().toString());
        book.setHasPdf(true);
        bookService.save(book);
    }

    public MinioFileStorageService.StoredFile getBookPdfFile(UUID bookId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        if (!book.isHasPdf()) {
            throw new BookPdfNotFoundException(bookId);
        }
        try {
            return minioFileStorageService.getPdfObject(book.getId().toString());
        } catch (FileStorageException ex) {
            log.warn("PDF não encontrado no storage para livro {}: {}", bookId, ex.getMessage());
            throw new BookPdfNotFoundException(bookId);
        }
    }

}
