package com.unichristus.libraryapi.infrastructure.persistence.collection;

import com.unichristus.libraryapi.domain.collection.BookCollection;
import com.unichristus.libraryapi.domain.collection.BookCollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.domain.Page;

@Repository
@RequiredArgsConstructor
public class BookCollectionRepositoryImpl implements BookCollectionRepository {

    private final BookCollectionJpaRepository bookCollectionJpaRepository;

    @Override
    public List<BookCollection> findLatest(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return bookCollectionJpaRepository.findAll(pageable).getContent();
    }

    @Override
    public Page<BookCollection> findAll(Pageable pageable) {
        return bookCollectionJpaRepository.findAll(pageable);
    }

    @Override
    public Optional<BookCollection> findById(UUID id) {
        return bookCollectionJpaRepository.findById(id);
    }

    @Override
    public long count() {
        return bookCollectionJpaRepository.count();
    }

    @Override
    public BookCollection save(BookCollection collection) {
        return bookCollectionJpaRepository.save(collection);
    }

    @Override
    public boolean existsById(UUID id) {
        return bookCollectionJpaRepository.existsById(id);
    }

    @Override
    public void delete(BookCollection collection) {
        bookCollectionJpaRepository.delete(collection);
    }
}
