package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.ExternalBooksImportRequest;
import com.unichristus.libraryapi.application.dto.response.ExternalBooksImportResponse;
import com.unichristus.libraryapi.domain.book.exception.BookIsbnConflict;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import com.unichristus.libraryapi.infrastructure.storage.MinioFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@UseCase
@RequiredArgsConstructor
public class BookImportUseCase {

    private static final int MESSAGE_LIMIT = 40;

    private final OpenLibraryClient openLibraryClient;
    private final BookService bookService;
    private final MinioFileStorageService minioFileStorageService;

    @Value("${app.integrations.open-library.max-download-bytes:52428800}")
    private int maxDownloadBytes;

    public ExternalBooksImportResponse importFromOpenLibrary(ExternalBooksImportRequest request) {
        int fetched = 0;
        int imported = 0;
        int skipped = 0;
        int failed = 0;
        List<String> messages = new ArrayList<>();
        Set<String> seenIsbn = new HashSet<>();

        for (int page = 1; page <= request.pages(); page++) {
            OpenLibraryClient.OpenLibrarySearchResponse result = openLibraryClient.search(request.query(), page, request.pageSize());
            List<OpenLibraryClient.OpenLibraryDoc> docs = result.docs() == null ? List.of() : result.docs();
            if (docs.isEmpty()) {
                break;
            }

            for (OpenLibraryClient.OpenLibraryDoc doc : docs) {
                fetched++;
                try {
                    if (doc == null || isBlank(doc.title())) {
                        skipped++;
                        addMessage(messages, "Skipped item without title");
                        continue;
                    }

                    Optional<String> normalizedIsbn = extractIsbn13(doc.isbn());
                    if (normalizedIsbn.isEmpty()) {
                        skipped++;
                        addMessage(messages, "Skipped '%s': no valid ISBN-13".formatted(doc.title()));
                        continue;
                    }

                    String isbn = normalizedIsbn.get();
                    if (!seenIsbn.add(isbn)) {
                        skipped++;
                        continue;
                    }

                    Integer pages = OpenLibraryBookMetadataSupport.sanitizePages(doc.numberOfPagesMedian());
                    var publicationDate = OpenLibraryBookMetadataSupport.sanitizePublicationDate(doc.firstPublishYear());
                    String coverUrl = OpenLibraryBookMetadataSupport.coverUrlFrom(doc.coverId());

                    Book createdBook = bookService.upsertOpenLibraryBook(
                            doc.title().trim(),
                            resolveAuthor(doc.authorNames()),
                            isbn,
                            pages,
                            publicationDate,
                            coverUrl);

                    tryAttachPdfFromArchiveIfAvailable(doc, createdBook, messages);
                    imported++;
                } catch (BookIsbnConflict conflict) {
                    skipped++;
                } catch (Exception ex) {
                    failed++;
                    addMessage(messages, "Failed importing '%s': %s".formatted(
                            doc != null ? Objects.toString(doc.title(), "<no-title>") : "<null-doc>",
                            ex.getMessage()));
                }
            }
        }

        return new ExternalBooksImportResponse(fetched, imported, skipped, failed, messages);
    }

    private Optional<String> extractIsbn13(List<String> isbns) {
        if (isbns == null || isbns.isEmpty()) {
            return Optional.empty();
        }
        for (String raw : isbns) {
            if (raw == null) {
                continue;
            }
            String normalized = raw.replaceAll("[^0-9Xx]", "");
            if (normalized.length() == 13 && normalized.chars().allMatch(Character::isDigit)) {
                return Optional.of(normalized);
            }
        }
        return Optional.empty();
    }

    private void addMessage(List<String> messages, String message) {
        if (messages.size() < MESSAGE_LIMIT) {
            messages.add(message);
        }
    }

    private void tryAttachPdfFromArchiveIfAvailable(OpenLibraryClient.OpenLibraryDoc doc, Book createdBook, List<String> messages) {
        Optional<String> maybeDownloadUrl = Optional.ofNullable(openLibraryClient.findArchivePdfDownloadUrl(doc))
                .orElse(Optional.empty());

        maybeDownloadUrl.ifPresent(downloadUrl -> {
            try {
                OpenLibraryClient.DownloadedBinary downloaded = openLibraryClient.downloadBinary(downloadUrl, maxDownloadBytes);
                minioFileStorageService.uploadPdf(downloaded.bytes(), createdBook.getId().toString(), downloaded.contentType());
                createdBook.setHasPdf(true);
                bookService.save(createdBook);
                addMessage(messages, "PDF anexado para '%s'".formatted(createdBook.getTitle()));
            } catch (Exception ex) {
                addMessage(messages, "Livro '%s' importado sem PDF: %s".formatted(createdBook.getTitle(), ex.getMessage()));
            }
        });
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String resolveAuthor(List<String> authorNames) {
        if (authorNames == null || authorNames.isEmpty()) {
            return "Autor nao informado";
        }
        return authorNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isBlank())
                .findFirst()
                .orElse("Autor nao informado");
    }
}
