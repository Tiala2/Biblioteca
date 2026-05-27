package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.dto.request.ExternalBooksImportRequest;
import com.unichristus.libraryapi.application.dto.response.ExternalBooksImportResponse;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.infrastructure.integration.gutenberg.GutenbergClient;
import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import com.unichristus.libraryapi.infrastructure.pdf.TextPdfRenderer;
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
    private GutenbergClient gutenbergClient;

    @Mock
    private TextPdfRenderer textPdfRenderer;

    @Mock
    private BookService bookService;

    @Mock
    private MinioFileStorageService minioFileStorageService;

    @Test
    void shouldContinueImportWhenOneOpenLibraryPageFails() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, gutenbergClient, textPdfRenderer, bookService, minioFileStorageService);
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
        assertThat(response.messages()).anyMatch(message -> message.contains("2") && message.contains("Open Library"));

        verify(bookService).upsertOpenLibraryBook(
                eq("Effective Java"),
                eq("Joshua Bloch"),
                eq("9780134685991"),
                eq(416),
                eq(LocalDate.of(2018, 1, 1)),
                any());
        verify(minioFileStorageService, never()).uploadPdf(any(), any(), any());
    }

    @Test
    void shouldImportOnlyReadableBooksUntilTargetCount() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, gutenbergClient, textPdfRenderer, bookService, minioFileStorageService);
        ReflectionTestUtils.setField(useCase, "maxDownloadBytes", 1024);

        ExternalBooksImportRequest request = new ExternalBooksImportRequest("subject:fiction", 3, 2, true, 1);

        OpenLibraryClient.OpenLibraryDoc readableDoc = new OpenLibraryClient.OpenLibraryDoc(
                "The Picture of Dorian Gray",
                List.of("Oscar Wilde"),
                List.of("9780141439570"),
                256,
                1890,
                321,
                List.of("pictureofdoriang00wild_5"),
                new OpenLibraryClient.OpenLibraryAvailability("pictureofdoriang00wild_5")
        );
        OpenLibraryClient.OpenLibraryDoc skippedDoc = new OpenLibraryClient.OpenLibraryDoc(
                "Unreadable Book",
                List.of("Unknown"),
                List.of("9780000000000"),
                100,
                2000,
                654
        );

        when(openLibraryClient.searchReadable("subject:fiction", 1, 2))
                .thenReturn(new OpenLibraryClient.OpenLibrarySearchResponse(2, List.of(skippedDoc, readableDoc)));
        when(openLibraryClient.hasEmbeddableReader(skippedDoc)).thenReturn(false);
        when(openLibraryClient.hasEmbeddableReader(readableDoc)).thenReturn(true);

        Book createdBook = Book.builder()
                .id(UUID.randomUUID())
                .title("The Picture of Dorian Gray")
                .author("Oscar Wilde")
                .isbn("9780141439570")
                .publicationDate(LocalDate.of(1890, 1, 1))
                .categories(Set.of())
                .build();

        when(bookService.upsertOpenLibraryBook(
                eq("The Picture of Dorian Gray"),
                eq("Oscar Wilde"),
                eq("9780141439570"),
                eq(256),
                eq(LocalDate.of(1890, 1, 1)),
                any()))
                .thenReturn(createdBook);

        ExternalBooksImportResponse response = useCase.importFromOpenLibrary(request);

        assertThat(response.fetched()).isEqualTo(2);
        assertThat(response.imported()).isEqualTo(1);
        assertThat(response.skipped()).isEqualTo(1);
        assertThat(response.messages()).anyMatch(message -> message.contains("leitor"));
        verify(openLibraryClient).searchReadable("subject:fiction", 1, 2);
        verify(openLibraryClient, never()).search("subject:fiction", 1, 2);
    }

    @Test
    void shouldEstimateGutenbergPagesFromDownloadedText() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, gutenbergClient, textPdfRenderer, bookService, minioFileStorageService);
        ExternalBooksImportRequest request = new ExternalBooksImportRequest("fiction", 5, 100, false, 1);
        GutenbergClient.GutenbergBook candidate = new GutenbergClient.GutenbergBook(
                1342,
                "Pride and Prejudice",
                "Jane Austen",
                40,
                1813,
                "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
                "https://www.gutenberg.org/cache/epub/1342/pg1342.txt"
        );
        String text = "word ".repeat(7800);
        Book book = Book.builder()
                .id(UUID.randomUUID())
                .title("Pride and Prejudice")
                .author("Jane Austen")
                .isbn("9789000001342")
                .numberOfPages(40)
                .publicationDate(LocalDate.of(1813, 1, 1))
                .categories(Set.of())
                .build();

        when(gutenbergClient.searchReadableBooks("fiction", 5, 3)).thenReturn(List.of(candidate));
        when(gutenbergClient.downloadPlainText(candidate.textUrl(), candidate.id())).thenReturn(text);
        when(bookService.upsertGutenbergBook(
                eq("Pride and Prejudice"),
                eq("Jane Austen"),
                eq("9789000001342"),
                eq(30),
                eq(LocalDate.of(1813, 1, 1)),
                eq(candidate.coverUrl())))
                .thenReturn(book);
        when(textPdfRenderer.render("Pride and Prejudice", "Jane Austen", text)).thenReturn(new byte[]{1, 2, 3});

        ExternalBooksImportResponse response = useCase.importFromGutenberg(request);

        assertThat(response.imported()).isEqualTo(1);
        assertThat(book.getNumberOfPages()).isEqualTo(30);
        verify(minioFileStorageService).uploadPdf(new byte[]{1, 2, 3}, book.getId().toString(), "application/pdf");
        verify(bookService).save(book);
    }

    @Test
    void shouldSkipGutenbergTextThatIsTooShortForInternalReading() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, gutenbergClient, textPdfRenderer, bookService, minioFileStorageService);
        ExternalBooksImportRequest request = new ExternalBooksImportRequest("fiction", 1, 20, false, 1);
        GutenbergClient.GutenbergBook candidate = new GutenbergClient.GutenbergBook(
                9999,
                "Short Catalogue Note",
                "Unknown",
                20,
                1900,
                null,
                "https://www.gutenberg.org/cache/epub/9999/pg9999.txt"
        );

        when(gutenbergClient.searchReadableBooks("fiction", 1, 3)).thenReturn(List.of(candidate));
        when(gutenbergClient.downloadPlainText(candidate.textUrl(), candidate.id())).thenReturn("word ".repeat(400));

        ExternalBooksImportResponse response = useCase.importFromGutenberg(request);

        assertThat(response.imported()).isZero();
        assertThat(response.skipped()).isEqualTo(1);
        assertThat(response.messages()).anyMatch(message -> message.contains("texto muito curto"));
        verify(bookService, never()).upsertGutenbergBook(any(), any(), any(), anyInt(), any(), any());
        verify(textPdfRenderer, never()).render(any(), any(), any());
        verify(minioFileStorageService, never()).uploadPdf(any(), any(), any());
    }

    @Test
    void shouldUseExtraGutenbergCandidatesToCompensateSkippedItems() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, gutenbergClient, textPdfRenderer, bookService, minioFileStorageService);
        ExternalBooksImportRequest request = new ExternalBooksImportRequest("fiction", 2, 100, false, 1);
        GutenbergClient.GutenbergBook shortCandidate = new GutenbergClient.GutenbergBook(
                9998,
                "Short Note",
                "Unknown",
                20,
                1900,
                null,
                "https://www.gutenberg.org/cache/epub/9998/pg9998.txt"
        );
        GutenbergClient.GutenbergBook validCandidate = new GutenbergClient.GutenbergBook(
                84,
                "Frankenstein",
                "Mary Shelley",
                280,
                1818,
                "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
                "https://www.gutenberg.org/cache/epub/84/pg84.txt"
        );
        String validText = "word ".repeat(5_200);
        Book book = Book.builder()
                .id(UUID.randomUUID())
                .title("Frankenstein")
                .author("Mary Shelley")
                .isbn("9789000000084")
                .numberOfPages(20)
                .publicationDate(LocalDate.of(1818, 1, 1))
                .categories(Set.of())
                .build();

        when(gutenbergClient.searchReadableBooks("fiction", 2, 3)).thenReturn(List.of(shortCandidate, validCandidate));
        when(gutenbergClient.downloadPlainText(shortCandidate.textUrl(), shortCandidate.id())).thenReturn("word ".repeat(300));
        when(gutenbergClient.downloadPlainText(validCandidate.textUrl(), validCandidate.id())).thenReturn(validText);
        when(bookService.upsertGutenbergBook(
                eq("Frankenstein"),
                eq("Mary Shelley"),
                eq("9789000000084"),
                eq(20),
                eq(LocalDate.of(1818, 1, 1)),
                eq(validCandidate.coverUrl())))
                .thenReturn(book);
        when(textPdfRenderer.render("Frankenstein", "Mary Shelley", validText)).thenReturn(new byte[]{4, 5, 6});

        ExternalBooksImportResponse response = useCase.importFromGutenberg(request);

        assertThat(response.fetched()).isEqualTo(2);
        assertThat(response.imported()).isEqualTo(1);
        assertThat(response.skipped()).isEqualTo(1);
        verify(bookService).save(book);
    }

    @Test
    void shouldNormalizeOpenLibrarySubjectQueryBeforeGutenbergSearch() {
        BookImportUseCase useCase = new BookImportUseCase(openLibraryClient, gutenbergClient, textPdfRenderer, bookService, minioFileStorageService);
        ExternalBooksImportRequest request = new ExternalBooksImportRequest("subject:fiction", 2, 100, false, 1);

        when(gutenbergClient.searchReadableBooks("fiction", 2, 3)).thenReturn(List.of());

        ExternalBooksImportResponse response = useCase.importFromGutenberg(request);

        assertThat(response.imported()).isZero();
        verify(gutenbergClient).searchReadableBooks("fiction", 2, 3);
    }
}
