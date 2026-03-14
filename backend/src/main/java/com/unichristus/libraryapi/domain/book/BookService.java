package com.unichristus.libraryapi.domain.book;

import com.unichristus.libraryapi.domain.book.exception.BookIsbnConflict;
import com.unichristus.libraryapi.domain.book.exception.BookNotFoundException;
import com.unichristus.libraryapi.domain.category.Category;
import com.unichristus.libraryapi.domain.book.BookSearchHit;
import com.unichristus.libraryapi.domain.book.BookSort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public Page<Book> findAllAvailable(Pageable pageable) {
        return bookRepository.findBooksByAvailableTrueAndHasPdfTrue(pageable);
    }

    public Book findBookByIdOrThrow(UUID bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));
    }

    public Book save(Book book) {
        return bookRepository.save(book);
    }

    public List<Book> findByIds(Iterable<UUID> ids) {
        return bookRepository.findByIds(ids);
    }

    public Book createBook(String title, String isbn, Integer numberOfPages, LocalDate publicationDate, String coverUrl,
                           Set<Category> categories) {
        validateISBNUnique(isbn);
        Book book = Book.builder()
                .title(title)
                .coverUrl(coverUrl)
                .isbn(isbn)
                .numberOfPages(numberOfPages)
                .publicationDate(publicationDate)
                .available(true)
                .source(BookSource.LOCAL)
                .lastSeenAt(LocalDateTime.now())
                .categories(categories)
                .build();
        return save(book);
    }

    @Transactional
    public Book upsertOpenLibraryBook(String title, String isbn, Integer numberOfPages, LocalDate publicationDate, String coverUrl) {
        LocalDateTime now = LocalDateTime.now();
        var existing = bookRepository.findByIsbn(isbn);
        if (existing.isPresent()) {
            Book book = existing.get();
            book.setLastSeenAt(now);
            if ((book.getCoverUrl() == null || book.getCoverUrl().isBlank()) && coverUrl != null && !coverUrl.isBlank()) {
                book.setCoverUrl(coverUrl);
            }
            return save(book);
        }

        Book created = Book.builder()
                .title(title)
                .coverUrl(coverUrl)
                .isbn(isbn)
                .numberOfPages(numberOfPages)
                .publicationDate(publicationDate)
                .available(true)
                .source(BookSource.OPEN)
                .lastSeenAt(now)
                .categories(Set.of())
                .build();
        return save(created);
    }

    public void updateBook(UUID bookId, String title, String isbn, Integer numberOfPages, LocalDate publicationDate, String coverUrl, Boolean available, Set<Category> categories) {
        Book book = findBookByIdOrThrow(bookId);
        boolean changed = false;
        if (title != null && !title.equals(book.getTitle())) {
            book.setTitle(title);
            changed = true;
        }
        if (isbn != null && !isbn.equals(book.getIsbn())) {
            validateISBNUnique(isbn);
            book.setIsbn(isbn);
            changed = true;
        }
        if (numberOfPages != null && !numberOfPages.equals(book.getNumberOfPages())) {
            book.setNumberOfPages(numberOfPages);
            changed = true;
        }
        if (publicationDate != null && !publicationDate.equals(book.getPublicationDate())) {
            book.setPublicationDate(publicationDate);
            changed = true;
        }
        if (coverUrl != null) {
            String normalizedCoverUrl = coverUrl.isBlank() ? null : coverUrl.trim();
            if (!java.util.Objects.equals(normalizedCoverUrl, book.getCoverUrl())) {
                book.setCoverUrl(normalizedCoverUrl);
                changed = true;
            }
        }
        if (available != null && !available.equals(book.isAvailable())) {
            book.setAvailable(available);
            changed = true;
        }
        if (categories != null && !categories.equals(book.getCategories())) {
            book.setCategories(categories);
            changed = true;
        }
        if (changed) {
            save(book);
        }
    }

    private void validateISBNUnique(String isbn) {
        if (bookRepository.existsBookByIsbn(isbn)) {
            throw new BookIsbnConflict(isbn);
        }
    }

    public void invalidateBook(Book book) {
        book.setAvailable(false);
        save(book);
    }

    public Page<Book> findBooksByCategory(Category category, Pageable pageable) {
        return bookRepository.findBooksByCategory(category, pageable);
    }

    public long count() {
        return bookRepository.count();
    }

    @Transactional
    public long deleteStaleOpenLibraryBooks(LocalDateTime cutoff) {
        return bookRepository.deleteStaleOpenLibraryBooks(cutoff);
    }

    public Page<BookSearchHit> search(String query,
                                      List<UUID> categoryIds,
                                      List<UUID> tagIds,
                                      Integer minPages,
                                      Integer maxPages,
                                      LocalDate publicationFrom,
                                      LocalDate publicationTo,
                                      boolean includeWithoutPdf,
                                      BookSort sort,
                                      Pageable pageable) {
        BookSort effectiveSort = sort != null ? sort : BookSort.BEST_RATED;

        List<UUID> normalizedCategories = (categoryIds == null || categoryIds.isEmpty()) ? null : categoryIds;
        List<UUID> normalizedTags = (tagIds == null || tagIds.isEmpty()) ? null : tagIds;

        LocalDate periodDate = switch (effectiveSort) {
            case TRENDING_MONTH -> LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
            case TRENDING_WEEK -> LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            default -> LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        };
        LocalDateTime periodStart = periodDate.atStartOfDay();

        LocalDateTime publicationFromDateTime = publicationFrom != null ? publicationFrom.atStartOfDay() : null;
        LocalDateTime publicationToDateTime = publicationTo != null ? publicationTo.atTime(23, 59, 59) : null;

        return bookRepository.search(
                query,
                normalizedCategories,
                normalizedTags,
                minPages,
                maxPages,
                publicationFromDateTime,
                publicationToDateTime,
                periodStart,
                includeWithoutPdf,
                effectiveSort,
                pageable);
    }
}

