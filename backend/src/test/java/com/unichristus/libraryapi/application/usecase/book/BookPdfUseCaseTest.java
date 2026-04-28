package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.book.exception.BookPdfNotFoundException;
import com.unichristus.libraryapi.domain.review.ReviewService;
import com.unichristus.libraryapi.infrastructure.storage.MinioFileStorageService;
import com.unichristus.libraryapi.infrastructure.storage.exception.FileStorageException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookPdfUseCaseTest {

    @Mock
    private BookService bookService;

    @Mock
    private ReviewService reviewService;

    @Mock
    private MinioFileStorageService minioFileStorageService;

    @Test
    void shouldReturnNullPdfUrlWhenStorageIsUnavailable() {
        Book book = Book.builder()
                .id(UUID.randomUUID())
                .hasPdf(true)
                .build();

        BookPdfUseCase useCase = new BookPdfUseCase(bookService, reviewService, minioFileStorageService);

        when(minioFileStorageService.generatePresignedUrl(book.getId().toString()))
                .thenThrow(new RuntimeException("storage unavailable"));

        assertThat(useCase.getBookPdfUrl(book)).isNull();
    }

    @Test
    void shouldTranslateStorageLookupFailureToBookPdfNotFound() {
        UUID bookId = UUID.randomUUID();
        Book book = Book.builder()
                .id(bookId)
                .hasPdf(true)
                .build();

        BookPdfUseCase useCase = new BookPdfUseCase(bookService, reviewService, minioFileStorageService);

        when(bookService.findBookByIdOrThrow(bookId)).thenReturn(book);
        when(minioFileStorageService.getPdfObject(bookId.toString()))
                .thenThrow(new FileStorageException("missing object"));

        assertThatThrownBy(() -> useCase.getBookPdfFile(bookId))
                .isInstanceOf(BookPdfNotFoundException.class);
    }
}
