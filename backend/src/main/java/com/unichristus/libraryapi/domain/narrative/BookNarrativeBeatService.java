package com.unichristus.libraryapi.domain.narrative;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookNarrativeBeatService {

    private final BookNarrativeBeatRepository repository;

    public List<BookNarrativeBeat> findByBookId(UUID bookId) {
        return repository.findByBookIdOrderByStartPage(bookId);
    }

    public Optional<BookNarrativeBeat> findCurrentBeat(UUID bookId, int currentPage) {
        return repository.findCurrentBeat(bookId, currentPage);
    }
}

