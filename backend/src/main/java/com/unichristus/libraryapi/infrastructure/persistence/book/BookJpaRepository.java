package com.unichristus.libraryapi.infrastructure.persistence.book;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.infrastructure.persistence.book.projection.BookSearchProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookJpaRepository extends JpaRepository<Book, UUID> {

    boolean existsBookByIsbn(String isbn);

    java.util.Optional<Book> findByIsbn(String isbn);

    List<Book> findByIdIn(Iterable<UUID> ids);

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

        @Query(value = """
                        SELECT b.id AS bookId,
                                     COALESCE(rating.avg_rating, 0)        AS averageRating,
                                     COALESCE(rating.total_reviews, 0)     AS totalReviews,
                                     COALESCE(period_reads.reads_count, 0) AS weeklyReads
                        FROM books b
                                         LEFT JOIN (
                                SELECT r.book_id, AVG(r.rating) AS avg_rating, COUNT(*) AS total_reviews
                                FROM reviews r
                                GROUP BY r.book_id
                        ) rating ON rating.book_id = b.id
                                         LEFT JOIN (
                                SELECT rs.book_id, COUNT(*) AS reads_count
                                FROM reading_sessions rs
                                WHERE rs.logged_at >= :periodStart
                                GROUP BY rs.book_id
                        ) period_reads ON period_reads.book_id = b.id
                        WHERE b.available = TRUE
                            AND (:includeWithoutPdf = TRUE OR b.has_pdf = TRUE)
                            AND (:query IS NULL OR LOWER(b.title) LIKE CONCAT('%', LOWER(:query), '%'))
                            AND (:minPages IS NULL OR b.number_of_pages >= :minPages)
                            AND (:maxPages IS NULL OR b.number_of_pages <= :maxPages)
                            AND (:hasPublicationFrom = FALSE OR b.publication_date >= CAST(:publicationFrom AS DATE))
                            AND (:hasPublicationTo = FALSE OR b.publication_date <= CAST(:publicationTo AS DATE))
                            AND (:hasCategoryFilter = FALSE OR EXISTS(SELECT 1 FROM book_categories bc WHERE bc.book_id = b.id AND bc.category_id IN (:categoryIds)))
                            AND (:hasTagFilter = FALSE OR EXISTS(SELECT 1 FROM book_tags bt WHERE bt.book_id = b.id AND bt.tag_id IN (:tagIds)))
                        ORDER BY
                                CASE WHEN :sort = 'TRENDING_WEEK' THEN COALESCE(period_reads.reads_count, 0) END DESC,
                                CASE WHEN :sort = 'TRENDING_MONTH' THEN COALESCE(period_reads.reads_count, 0) END DESC,
                                CASE WHEN :sort = 'BEST_RATED' THEN COALESCE(rating.avg_rating, 0) END DESC,
                                CASE WHEN :sort = 'BEST_RATED' THEN COALESCE(rating.total_reviews, 0) END DESC,
                                CASE WHEN :sort = 'NEW_RELEASES' THEN b.publication_date END DESC,
                                b.title ASC
                        """,
                        countQuery = """
                        SELECT COUNT(1)
                        FROM books b
                        WHERE b.available = TRUE
                            AND (:includeWithoutPdf = TRUE OR b.has_pdf = TRUE)
                            AND (:query IS NULL OR LOWER(b.title) LIKE CONCAT('%', LOWER(:query), '%'))
                            AND (:minPages IS NULL OR b.number_of_pages >= :minPages)
                            AND (:maxPages IS NULL OR b.number_of_pages <= :maxPages)
                            AND (:hasPublicationFrom = FALSE OR b.publication_date >= CAST(:publicationFrom AS DATE))
                            AND (:hasPublicationTo = FALSE OR b.publication_date <= CAST(:publicationTo AS DATE))
                            AND (:hasCategoryFilter = FALSE OR EXISTS(SELECT 1 FROM book_categories bc WHERE bc.book_id = b.id AND bc.category_id IN (:categoryIds)))
                            AND (:hasTagFilter = FALSE OR EXISTS(SELECT 1 FROM book_tags bt WHERE bt.book_id = b.id AND bt.tag_id IN (:tagIds)))
                        """,
                        nativeQuery = true)
        Page<BookSearchProjection> search(@Param("query") String query,
                                                                            @Param("categoryIds") java.util.List<UUID> categoryIds,
                                                                            @Param("tagIds") java.util.List<UUID> tagIds,
                                                                            @Param("minPages") Integer minPages,
                                                                            @Param("maxPages") Integer maxPages,
                                                                            @Param("publicationFrom") java.time.LocalDateTime publicationFrom,
                                                                            @Param("publicationTo") java.time.LocalDateTime publicationTo,
                                                                            @Param("hasCategoryFilter") boolean hasCategoryFilter,
                                                                            @Param("hasTagFilter") boolean hasTagFilter,
                                                                            @Param("hasPublicationFrom") boolean hasPublicationFrom,
                                                                            @Param("hasPublicationTo") boolean hasPublicationTo,
                                                                            @Param("periodStart") java.time.LocalDateTime periodStart,
                                                                            @Param("includeWithoutPdf") boolean includeWithoutPdf,
                                                                            @Param("sort") String sort,
                                                                            Pageable pageable);

    @Modifying
    @Query(value = """
            DELETE FROM books b
            WHERE b.source = 'OPEN'
              AND b.has_pdf = FALSE
              AND b.last_seen_at < :cutoff
              AND NOT EXISTS (SELECT 1 FROM favorites f WHERE f.book_id = b.id)
              AND NOT EXISTS (SELECT 1 FROM readings r WHERE r.book_id = b.id)
              AND NOT EXISTS (SELECT 1 FROM reviews rv WHERE rv.book_id = b.id)
              AND NOT EXISTS (SELECT 1 FROM reading_sessions rs WHERE rs.book_id = b.id)
              AND NOT EXISTS (SELECT 1 FROM collection_books cb WHERE cb.book_id = b.id)
              AND NOT EXISTS (SELECT 1 FROM book_narrative_beats nb WHERE nb.book_id = b.id)
            """, nativeQuery = true)
    int deleteStaleOpenLibraryBooks(@Param("cutoff") java.time.LocalDateTime cutoff);

}
