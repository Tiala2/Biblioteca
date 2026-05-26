package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.ExternalBooksImportRequest;
import com.unichristus.libraryapi.application.dto.response.ExternalBooksImportResponse;
import com.unichristus.libraryapi.domain.book.exception.BookIsbnConflict;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.book.BookSource;
import com.unichristus.libraryapi.infrastructure.integration.gutenberg.GutenbergClient;
import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import com.unichristus.libraryapi.infrastructure.pdf.TextPdfRenderer;
import com.unichristus.libraryapi.infrastructure.storage.MinioFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
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
    private final GutenbergClient gutenbergClient;
    private final TextPdfRenderer textPdfRenderer;
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
        boolean readableOnly = request.shouldImportReadableOnly();
        int targetImportCount = request.resolvedTargetImportCount();

        for (int page = 1; page <= request.pages() && imported < targetImportCount; page++) {
            List<OpenLibraryClient.OpenLibraryDoc> docs;
            try {
                OpenLibraryClient.OpenLibrarySearchResponse result = readableOnly
                        ? openLibraryClient.searchReadable(request.query(), page, request.pageSize())
                        : openLibraryClient.search(request.query(), page, request.pageSize());
                docs = result.docs() == null ? List.of() : result.docs();
            } catch (Exception ex) {
                failed++;
                addMessage(messages, "Não foi possível consultar a página %d da Open Library. Tente novamente em instantes.".formatted(page));
                continue;
            }
            if (docs.isEmpty()) {
                break;
            }

            for (OpenLibraryClient.OpenLibraryDoc doc : docs) {
                if (imported >= targetImportCount) {
                    break;
                }
                fetched++;
                try {
                    if (doc == null || isBlank(doc.title())) {
                        skipped++;
                        addMessage(messages, "Um item foi ignorado porque veio sem título.");
                        continue;
                    }

                    if (readableOnly && !openLibraryClient.hasEmbeddableReader(doc)) {
                        skipped++;
                        addMessage(messages, "Livro '%s' ignorado: não há leitor incorporável disponível.".formatted(doc.title()));
                        continue;
                    }

                    Optional<String> normalizedIsbn = extractIsbn13(doc.isbn());
                    if (normalizedIsbn.isEmpty()) {
                        skipped++;
                        addMessage(messages, "Livro '%s' ignorado: ISBN-13 não informado pela Open Library.".formatted(doc.title()));
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

                    if (!readableOnly) {
                        tryAttachPdfFromArchiveIfAvailable(doc, createdBook, messages);
                    }
                    imported++;
                } catch (BookIsbnConflict conflict) {
                    skipped++;
                } catch (Exception ex) {
                    failed++;
                    addMessage(messages, "Não foi possível importar '%s'. Verifique os dados do livro e tente novamente.".formatted(
                            doc != null ? Objects.toString(doc.title(), "<sem-titulo>") : "<item-vazio>"));
                }
            }
        }

        return new ExternalBooksImportResponse(fetched, imported, skipped, failed, messages);
    }

    public ExternalBooksImportResponse importFromGutenberg(ExternalBooksImportRequest request) {
        int fetched = 0;
        int imported = 0;
        int skipped = 0;
        int failed = 0;
        List<String> messages = new ArrayList<>();
        int targetImportCount = request.resolvedTargetImportCount();
        List<GutenbergClient.GutenbergBook> candidates = gutenbergClient.searchReadableBooks(
                request.query(),
                request.pages(),
                targetImportCount);

        for (GutenbergClient.GutenbergBook candidate : candidates) {
            if (imported >= targetImportCount) {
                break;
            }
            fetched++;
            try {
                String text = gutenbergClient.downloadPlainText(candidate.textUrl(), candidate.id());
                if (text.isBlank()) {
                    skipped++;
                    addMessage(messages, "Livro '%s' ignorado: texto nao encontrado no Project Gutenberg.".formatted(candidate.title()));
                    continue;
                }

                Book book = bookService.upsertGutenbergBook(
                        candidate.title(),
                        candidate.author(),
                        gutenbergIsbn(candidate.id()),
                        candidate.pages(),
                        LocalDate.of(candidate.year(), 1, 1),
                        candidate.coverUrl());

                byte[] pdf = textPdfRenderer.render(book.getTitle(), book.getAuthor(), text);
                minioFileStorageService.uploadPdf(pdf, book.getId().toString(), "application/pdf");
                book.setHasPdf(true);
                book.setSource(BookSource.GUTENBERG);
                bookService.save(book);

                imported++;
                addMessage(messages, "Livro '%s' importado com leitura interna.".formatted(book.getTitle()));
            } catch (BookIsbnConflict conflict) {
                skipped++;
            } catch (Exception ex) {
                failed++;
                addMessage(messages, "Nao foi possivel importar '%s' do Project Gutenberg.".formatted(candidate.title()));
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
            return "Autor não informado";
        }
        return authorNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isBlank())
                .findFirst()
                .orElse("Autor não informado");
    }

    private String gutenbergIsbn(int gutenbergId) {
        return "9789" + "%09d".formatted(gutenbergId);
    }
}
