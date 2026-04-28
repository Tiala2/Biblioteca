package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.dto.request.ExternalBooksImportRequest;
import com.unichristus.libraryapi.application.dto.response.ExternalBooksImportResponse;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import com.unichristus.libraryapi.infrastructure.storage.MinioFileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookImportUseCaseTest {

    @Mock
    private OpenLibraryClient openLibraryClient;

    @Mock
    private BookService bookService;

    @Mock
    private MinioFileStorageService minioFileStorageService;

    @Test
    void shouldContinueImportWhenOneOpenLibraryPageFails() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, bookService, minioFileStorageService);
        ReflectionTestUtils.setField(useCase, "maxDownloadBytes", 1024);

        ExternalBooksImportRequest request = new ExternalBooksImportRequest("java", 3, 10);

        OpenLibraryClient.OpenLibraryDoc firstDoc = new OpenLibraryClient.OpenLibraryDoc(
                "Effective Java",
                List.of("Joshua Bloch"),
                List.of("9780134685991"),
                416,
                2018,
                123
        );

        when(openLibraryClient.search("java", 1, 10))
                .thenReturn(new OpenLibraryClient.OpenLibrarySearchResponse(1, List.of(firstDoc)));
        when(openLibraryClient.search("java", 2, 10))
                .thenThrow(new IllegalStateException("timeout"));
        when(openLibraryClient.search("java", 3, 10))
                .thenReturn(new OpenLibraryClient.OpenLibrarySearchResponse(0, List.of()));

        Book createdBook = Book.builder()
                .id(UUID.randomUUID())
                .title("Effective Java")
                .author("Joshua Bloch")
                .isbn("9780134685991")
                .publicationDate(LocalDate.of(2018, 1, 1))
                .categories(Set.of())
                .build();

        when(bookService.upsertOpenLibraryBook(
                eq("Effective Java"),
                eq("Joshua Bloch"),
                eq("9780134685991"),
                eq(416),
                eq(LocalDate.of(2018, 1, 1)),
                any()))
                .thenReturn(createdBook);

        when(openLibraryClient.findArchivePdfDownloadUrl(firstDoc)).thenReturn(java.util.Optional.empty());

        ExternalBooksImportResponse response = useCase.importFromOpenLibrary(request);

        assertThat(response.fetched()).isEqualTo(1);
        assertThat(response.imported()).isEqualTo(1);
        assertThat(response.failed()).isEqualTo(1);
        assertThat(response.messages()).anyMatch(message -> message.contains("Failed fetching Open Library page 2"));

        verify(bookService).upsertOpenLibraryBook(
                eq("Effective Java"),
                eq("Joshua Bloch"),
                eq("9780134685991"),
                eq(416),
                eq(LocalDate.of(2018, 1, 1)),
                any());
        verify(minioFileStorageService, never()).uploadPdf(any(), any(), any());
    }
}
