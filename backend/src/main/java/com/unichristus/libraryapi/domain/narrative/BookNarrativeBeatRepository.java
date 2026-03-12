package com.unichristus.libraryapi.domain.narrative;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookNarrativeBeatRepository {

    List<BookNarrativeBeat> findByBookIdOrderByStartPage(UUID bookId);

    Optional<BookNarrativeBeat> findCurrentBeat(UUID bookId, int currentPage);
}

