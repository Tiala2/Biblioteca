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
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

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
            throw new BookPdfNotFoundException(book.getId());
        }
        return minioFileStorageService.generatePresignedUrl(book.getId().toString());
    }

    public void uploadBookPdf(UUID bookId, MultipartFile file) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        minioFileStorageService.uploadPdf(file, book.getId().toString());
        book.setHasPdf(true);
        bookService.save(book);
    }

}
