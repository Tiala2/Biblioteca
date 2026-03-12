package com.unichristus.libraryapi.infrastructure.persistence.book;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookRepository;
import com.unichristus.libraryapi.domain.book.BookSearchHit;
import com.unichristus.libraryapi.domain.book.BookSort;
import com.unichristus.libraryapi.domain.category.Category;
import com.unichristus.libraryapi.infrastructure.persistence.book.projection.BookSearchProjection;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class BookRepositoryImpl implements BookRepository {

    private static final UUID EMPTY_FILTER_UUID = new UUID(0L, 0L);

    private final BookJpaRepository bookJpaRepository;

    @Override
    public Book save(Book book) {
        return bookJpaRepository.save(book);
    }

    @Override
    public Optional<Book> findById(UUID id) {
        return bookJpaRepository.findById(id);
    }

    @Override
    public Optional<Book> findByIsbn(String isbn) {
        return bookJpaRepository.findByIsbn(isbn);
    }

    @Override
    public List<Book> findByIds(Iterable<UUID> ids) {
        return bookJpaRepository.findByIdIn(ids);
    }

    @Override
    public boolean existsBookByIsbn(String isbn) {
        return bookJpaRepository.existsBookByIsbn(isbn);
    }

    @Override
    public Page<Book> findBooksByAvailableTrueAndHasPdfTrue(Pageable pageable) {
        return bookJpaRepository.findBooksByAvailableTrueAndHasPdfTrue(pageable);
    }

    @Override
    public Page<Book> findBooksByCategory(Category category, Pageable pageable) {
        return bookJpaRepository.findBooksByCategoryId(category.getId(), pageable);
    }

    @Override
    public Page<BookSearchHit> search(String query,
                                      List<UUID> categoryIds,
                                      List<UUID> tagIds,
                                      Integer minPages,
                                      Integer maxPages,
                                      LocalDateTime publicationFrom,
                                      LocalDateTime publicationTo,
                                      LocalDateTime periodStart,
                                      boolean includeWithoutPdf,
                                      BookSort sort,
                                      Pageable pageable) {
        boolean hasCategoryFilter = categoryIds != null && !categoryIds.isEmpty();
        boolean hasTagFilter = tagIds != null && !tagIds.isEmpty();
        boolean hasPublicationFrom = publicationFrom != null;
        boolean hasPublicationTo = publicationTo != null;

        List<UUID> safeCategoryIds = hasCategoryFilter ? categoryIds : List.of(EMPTY_FILTER_UUID);
        List<UUID> safeTagIds = hasTagFilter ? tagIds : List.of(EMPTY_FILTER_UUID);

        Page<BookSearchProjection> page = bookJpaRepository.search(
                query,
                safeCategoryIds,
                safeTagIds,
                minPages,
                maxPages,
                publicationFrom,
                publicationTo,
                hasCategoryFilter,
                hasTagFilter,
                hasPublicationFrom,
                hasPublicationTo,
                periodStart,
                includeWithoutPdf,
                sort == null ? null : sort.name(),
                pageable);
        return page.map(hit -> new BookSearchHit(
                hit.getBookId(),
                hit.getAverageRating(),
                hit.getTotalReviews(),
                hit.getWeeklyReads()
        ));
    }

    @Override
    public long count() {
        return bookJpaRepository.count();
    }

    @Override
    @Transactional
    public long deleteStaleOpenLibraryBooks(LocalDateTime cutoff) {
        return bookJpaRepository.deleteStaleOpenLibraryBooks(cutoff);
    }
}
