package com.unichristus.libraryapi.domain.book;

import com.unichristus.libraryapi.domain.category.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.time.LocalDateTime;

import com.unichristus.libraryapi.domain.book.BookSort;
import com.unichristus.libraryapi.domain.book.BookSearchHit;

public interface BookRepository {

    Book save(Book book);

    Optional<Book> findById(UUID id);

    Optional<Book> findByIsbn(String isbn);

    List<Book> findByIds(Iterable<UUID> ids);

    boolean existsBookByIsbn(String isbn);

    Page<Book> findBooksByAvailableTrueAndHasPdfTrue(Pageable pageable);

    Page<Book> findBooksByCategory(Category category, Pageable pageable);

        Page<BookSearchHit> search(
            String query,
            String author,
            List<UUID> categoryIds,
            List<UUID> tagIds,
            Integer minPages,
            Integer maxPages,
            LocalDateTime publicationFrom,
            LocalDateTime publicationTo,
            LocalDateTime periodStart,
            boolean includeWithoutPdf,
            BookSort sort,
            Pageable pageable
        );

    long count();

    long deleteStaleOpenLibraryBooks(LocalDateTime cutoff);
}
