package com.unichristus.libraryapi.infrastructure.persistence.collection;

import com.unichristus.libraryapi.domain.collection.BookCollection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookCollectionJpaRepository extends JpaRepository<BookCollection, UUID> {

    @EntityGraph(attributePaths = {"books", "books.categories", "books.tags"})
    Page<BookCollection> findAll(Pageable pageable);
}
