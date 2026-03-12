package com.unichristus.libraryapi.infrastructure.persistence.narrative;

import com.unichristus.libraryapi.domain.narrative.BookNarrativeBeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookNarrativeBeatJpaRepository extends JpaRepository<BookNarrativeBeat, UUID> {

    @Query("""
            SELECT b FROM BookNarrativeBeat b
            WHERE b.book.id = :bookId
            ORDER BY b.startPage ASC
            """)
    List<BookNarrativeBeat> findByBookIdOrderByStartPage(@Param("bookId") UUID bookId);

    @Query("""
            SELECT b FROM BookNarrativeBeat b
            WHERE b.book.id = :bookId
              AND :currentPage BETWEEN b.startPage AND b.endPage
            ORDER BY b.startPage DESC
            """)
    List<BookNarrativeBeat> findCurrentCandidates(@Param("bookId") UUID bookId, @Param("currentPage") Integer currentPage);

    @Query("""
            SELECT b FROM BookNarrativeBeat b
            WHERE b.book.id = :bookId
              AND b.startPage <= :currentPage
            ORDER BY b.startPage DESC
            """)
    List<BookNarrativeBeat> findNearestLower(@Param("bookId") UUID bookId, @Param("currentPage") Integer currentPage);

    default Optional<BookNarrativeBeat> findCurrentBeat(UUID bookId, int currentPage) {
        List<BookNarrativeBeat> exact = findCurrentCandidates(bookId, currentPage);
        if (!exact.isEmpty()) {
            return Optional.of(exact.get(0));
        }
        List<BookNarrativeBeat> lower = findNearestLower(bookId, currentPage);
        return lower.isEmpty() ? Optional.empty() : Optional.of(lower.get(0));
    }
}

