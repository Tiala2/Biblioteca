package com.unichristus.libraryapi.infrastructure.persistence.narrative;

import com.unichristus.libraryapi.domain.narrative.BookNarrativeBeat;
import com.unichristus.libraryapi.domain.narrative.BookNarrativeBeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class BookNarrativeBeatRepositoryImpl implements BookNarrativeBeatRepository {

    private final BookNarrativeBeatJpaRepository repository;

    @Override
    public List<BookNarrativeBeat> findByBookIdOrderByStartPage(UUID bookId) {
        return repository.findByBookIdOrderByStartPage(bookId);
    }

    @Override
    public Optional<BookNarrativeBeat> findCurrentBeat(UUID bookId, int currentPage) {
        return repository.findCurrentBeat(bookId, currentPage);
    }
}

