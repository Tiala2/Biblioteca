package com.unichristus.libraryapi.infrastructure.persistence.book;

import com.unichristus.libraryapi.domain.book.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface BookJpaRepository extends JpaRepository<Book, UUID> {

    boolean existsBookByIsbn(String isbn);

    Page<Book> findBooksByAvailableTrueAndHasPdfTrue(Pageable pageable);

    @Query(value = """
            SELECT DISTINCT b.*
            FROM books b
            INNER JOIN book_categories bc ON b.id = bc.book_id
            WHERE bc.category_id = :categoryId
            AND b.available = true
            ORDER BY b.title
            """, nativeQuery = true)
    Page<Book> findBooksByCategoryId(@Param("categoryId") UUID categoryId, Pageable pageable);

}