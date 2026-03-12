package com.unichristus.libraryapi.domain.collection;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import com.unichristus.libraryapi.domain.exception.DomainException;
import com.unichristus.libraryapi.domain.exception.DomainError;

@Service
@RequiredArgsConstructor
public class BookCollectionService {

    private final BookCollectionRepository bookCollectionRepository;

    public List<BookCollection> findLatest(int limit) {
        return bookCollectionRepository.findLatest(limit);
    }

    public Page<BookCollection> findAll(Pageable pageable) {
        return bookCollectionRepository.findAll(pageable);
    }

    public BookCollection findByIdOrThrow(UUID id) {
        return bookCollectionRepository.findById(id)
                .orElseThrow(() -> new DomainException(DomainError.COLLECTION_NOT_FOUND, id));
    }

    public long count() {
        return bookCollectionRepository.count();
    }

    @Transactional
    public BookCollection save(BookCollection collection) {
        return bookCollectionRepository.save(collection);
    }

    @Transactional
    public void delete(UUID id) {
        BookCollection collection = findByIdOrThrow(id);
        bookCollectionRepository.delete(collection);
    }
}
