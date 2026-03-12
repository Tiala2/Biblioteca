package com.unichristus.libraryapi.domain.collection;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookCollectionRepository {

    List<BookCollection> findLatest(int limit);

    Page<BookCollection> findAll(Pageable pageable);

    Optional<BookCollection> findById(UUID id);

    long count();

    BookCollection save(BookCollection collection);

    boolean existsById(UUID id);

    void delete(BookCollection collection);
}
