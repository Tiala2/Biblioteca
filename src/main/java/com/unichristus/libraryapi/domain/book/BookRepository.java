package com.unichristus.libraryapi.domain.book;

import com.unichristus.libraryapi.domain.category.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface BookRepository {

    Book save(Book book);

    Optional<Book> findById(UUID id);

    boolean existsBookByIsbn(String isbn);

    Page<Book> findBooksByAvailableTrueAndHasPdfTrue(Pageable pageable);

    Page<Book> findBooksByCategory(Category category, Pageable pageable);
}
