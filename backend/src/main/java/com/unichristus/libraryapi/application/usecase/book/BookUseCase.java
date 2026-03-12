package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.BookCreateRequest;
import com.unichristus.libraryapi.application.dto.request.BookUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.BookListResponse;
import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.application.mapper.BookResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookSearchHit;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.book.BookSort;
import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
import com.unichristus.libraryapi.domain.favorite.Favorite;
import com.unichristus.libraryapi.domain.category.Category;
import com.unichristus.libraryapi.domain.category.CategoryService;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingService;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.favorite.FavoriteService;
import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@UseCase
@RequiredArgsConstructor
@Slf4j
public class BookUseCase {

    private final BookService bookService;
    private final CategoryService categoryService;
    private final FavoriteService favoriteService;
    private final ReadingService readingService;
    private final OpenLibraryClient openLibraryClient;
    private final MeterRegistry meterRegistry;

    public Page<BookListResponse> getAllBooks(String query,
                                              List<UUID> categoryIds,
                                              List<UUID> tagIds,
                                              Integer minPages,
                                              Integer maxPages,
                                              LocalDate publicationFrom,
                                              LocalDate publicationTo,
                                              boolean includeWithoutPdf,
                                              BookSort sort,
                                              Pageable pageable) {
        validateFilters(minPages, maxPages, publicationFrom, publicationTo);
        String sortTag = sort != null ? sort.name() : "BEST_RATED";
        boolean hasFilters = hasFilters(query, categoryIds, tagIds, minPages, maxPages, publicationFrom, publicationTo);
        Timer.Sample sample = Timer.start(meterRegistry);

        log.info("book-search filters query='{}' categories={} tags={} pages=[{}, {}] publication=[{}, {}] sort={} page={} size={} filters={}",
            query,
            categoryIds,
            tagIds,
            minPages,
            maxPages,
            publicationFrom,
            publicationTo,
            sort,
            pageable.getPageNumber(),
            pageable.getPageSize(),
            hasFilters);

        Page<BookSearchHit> hits = bookService.search(
                query,
                categoryIds,
                tagIds,
                minPages,
                maxPages,
                publicationFrom,
                publicationTo,
                includeWithoutPdf,
                sort,
                pageable);

        // Real-time fallback: if local search has no result on first page, fetch from Open Library and retry.
        if (shouldFallbackToOpenLibrary(query, pageable, hits)) {
            int imported = importFromOpenLibraryRealtime(query, Math.max(pageable.getPageSize(), 20));
            if (imported > 0) {
                hits = bookService.search(
                        query,
                        categoryIds,
                        tagIds,
                        minPages,
                        maxPages,
                        publicationFrom,
                        publicationTo,
                        includeWithoutPdf,
                        sort,
                        pageable);
            }
        }

        List<UUID> bookIds = hits.map(BookSearchHit::bookId).toList();
        List<Book> books = bookService.findByIds(bookIds);

        Map<UUID, Book> bookMap = books.stream().collect(Collectors.toMap(Book::getId, b -> b));
        List<BookListResponse> responses = hits.stream()
                .map(hit -> {
                    Book book = bookMap.get(hit.bookId());
                    if (book == null) {
                        return null;
                    }
                    BookAverageRating rating = new BookAverageRating(hit.bookId(), hit.averageRating(), hit.totalReviews());
                    return BookResponseMapper.toBookListResponse(book, rating);
                })
                .filter(Objects::nonNull)
                .toList();

        meterRegistry.counter("books.search.count",
                "sort", sortTag,
                "filters", String.valueOf(hasFilters)).increment();
        sample.stop(meterRegistry.timer("books.search.latency", "sort", sortTag, "filters", String.valueOf(hasFilters)));

        return new PageImpl<>(responses, pageable, hits.getTotalElements());
    }

    private boolean shouldFallbackToOpenLibrary(String query, Pageable pageable, Page<BookSearchHit> hits) {
        return query != null
                && !query.isBlank()
                && pageable.getPageNumber() == 0
                && hits.getTotalElements() == 0;
    }

    private int importFromOpenLibraryRealtime(String query, int limit) {
        try {
            OpenLibraryClient.OpenLibrarySearchResponse result = openLibraryClient.search(query, 1, Math.min(limit, 40));
            if (result == null || result.docs() == null || result.docs().isEmpty()) {
                return 0;
            }

            int imported = 0;
            Set<String> seenIsbn = new HashSet<>();

            for (OpenLibraryClient.OpenLibraryDoc doc : result.docs()) {
                if (doc == null || doc.title() == null || doc.title().isBlank()) {
                    continue;
                }

                Optional<String> isbnOpt = extractOrGenerateIsbn13(doc.isbn(), doc.title(), doc.firstPublishYear());
                if (isbnOpt.isEmpty()) {
                    continue;
                }

                String isbn = isbnOpt.get();
                if (!seenIsbn.add(isbn)) {
                    continue;
                }

                try {
                    bookService.upsertOpenLibraryBook(
                            doc.title().trim(),
                            isbn,
                            sanitizePages(doc.numberOfPagesMedian()),
                            sanitizePublicationDate(doc.firstPublishYear()),
                            doc.coverId() == null ? null : "https://covers.openlibrary.org/b/id/%d-L.jpg".formatted(doc.coverId()));
                    imported++;
                } catch (Exception ex) {
                    // Skip duplicates/conflicts and continue processing remaining docs.
                    log.debug("Open Library realtime import skipped for isbn={} title='{}': {}", isbn, doc.title(), ex.getMessage());
                }
            }

            if (imported > 0) {
                log.info("Open Library realtime import added {} book(s) for query='{}'", imported, query);
            } else {
                log.info("Open Library realtime import returned 0 new books for query='{}'", query);
            }
            return imported;
        } catch (Exception ex) {
            log.warn("Open Library realtime fallback failed for query='{}': {}", query, ex.getMessage());
            return 0;
        }
    }

    private Optional<String> extractOrGenerateIsbn13(List<String> isbns, String title, Integer firstPublishYear) {
        if (isbns == null || isbns.isEmpty()) {
            return Optional.of(generateSyntheticIsbn13(title, firstPublishYear));
        }

        for (String raw : isbns) {
            if (raw == null) {
                continue;
            }
            String normalized = raw.replaceAll("[^0-9Xx]", "");
            if (normalized.length() == 13 && normalized.chars().allMatch(Character::isDigit)) {
                return Optional.of(normalized);
            }
        }

        for (String raw : isbns) {
            if (raw == null) {
                continue;
            }
            String normalized = raw.replaceAll("[^0-9Xx]", "").toUpperCase(Locale.ROOT);
            if (normalized.length() == 10) {
                return Optional.of(convertIsbn10To13(normalized));
            }
        }

        return Optional.of(generateSyntheticIsbn13(title, firstPublishYear));
    }

    private String convertIsbn10To13(String isbn10) {
        String core = "978" + isbn10.substring(0, 9);
        int sum = 0;
        for (int i = 0; i < core.length(); i++) {
            int digit = Character.digit(core.charAt(i), 10);
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int checkDigit = (10 - (sum % 10)) % 10;
        return core + checkDigit;
    }

    private String generateSyntheticIsbn13(String title, Integer firstPublishYear) {
        long hash = Math.abs(Objects.hash(Objects.toString(title, "unknown"), firstPublishYear));
        String body9 = String.format("%09d", hash % 1_000_000_000L);
        String core = "979" + body9;

        int sum = 0;
        for (int i = 0; i < core.length(); i++) {
            int digit = Character.digit(core.charAt(i), 10);
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int checkDigit = (10 - (sum % 10)) % 10;
        return core + checkDigit;
    }

    private Integer sanitizePages(Integer value) {
        if (value == null || value < 1) {
            return 1;
        }
        return value;
    }

    private LocalDate sanitizePublicationDate(Integer firstPublishYear) {
        if (firstPublishYear == null || firstPublishYear < 1000) {
            return LocalDate.of(1970, 1, 1);
        }
        int currentYear = LocalDate.now().getYear();
        if (firstPublishYear >= currentYear) {
            return LocalDate.now().minusDays(1);
        }
        return LocalDate.of(firstPublishYear, 1, 1);
    }

    private void validateFilters(Integer minPages, Integer maxPages, LocalDate publicationFrom, LocalDate publicationTo) {
        if (minPages != null && minPages < 0) {
            throw new DomainException(DomainError.SEARCH_FILTER_INVALID, "minPages não pode ser negativo");
        }
        if (maxPages != null && maxPages < 0) {
            throw new DomainException(DomainError.SEARCH_FILTER_INVALID, "maxPages não pode ser negativo");
        }
        if (minPages != null && maxPages != null && minPages > maxPages) {
            throw new DomainException(DomainError.SEARCH_FILTER_INVALID, "minPages não pode ser maior que maxPages");
        }
        if (publicationFrom != null && publicationTo != null && publicationFrom.isAfter(publicationTo)) {
            throw new DomainException(DomainError.SEARCH_FILTER_INVALID, "publicationFrom não pode ser após publicationTo");
        }
    }

    private boolean hasFilters(String query,
                               List<UUID> categoryIds,
                               List<UUID> tagIds,
                               Integer minPages,
                               Integer maxPages,
                               LocalDate publicationFrom,
                               LocalDate publicationTo) {
        return (query != null && !query.isBlank())
                || (categoryIds != null && !categoryIds.isEmpty())
                || (tagIds != null && !tagIds.isEmpty())
                || minPages != null
                || maxPages != null
                || publicationFrom != null
                || publicationTo != null;
    }

    public BookResponse createBook(BookCreateRequest request) {
        Set<Category> categories = new HashSet<>();
        if (request.categories() != null && !request.categories().isEmpty()) {
            categories = categoryService.findCategoriesByIds(request.categories());
        }

        Book createdBook = bookService.createBook(
                request.title(),
                request.isbn(),
                request.numberOfPages(),
                request.publicationDate(),
                request.coverUrl(),
                categories

        );
        return BookResponseMapper.toBookResponse(createdBook);
    }

    public void updateBook(UUID bookId, BookUpdateRequest request) {
        Set<Category> categories = new HashSet<>();
        if (request.categories() != null && !request.categories().isEmpty()) {
            categories = categoryService.findCategoriesByIds(request.categories());
        }
        bookService.updateBook(
                bookId,
                request.title(),
                request.isbn(),
                request.numberOfPages(),
                request.publicationDate(),
                request.available(),
                categories
        );
    }

    public void invalidateBook(UUID bookId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        bookService.invalidateBook(book);
    }

    public List<BookListResponse> getRecommendations(UUID userId, int limit) {
        int effectiveLimit = Math.max(1, Math.min(limit, 12));
        Set<UUID> excludeBookIds = collectExcludedBooks(userId);
        UserPreferences preferences = buildPreferences(userId, 3, 3);
        boolean personalized = userId != null && (!preferences.categories().isEmpty() || !preferences.tags().isEmpty());
        Timer.Sample sample = Timer.start(meterRegistry);

        int pageSize = Math.min(effectiveLimit + excludeBookIds.size(), 20);
        var pageable = org.springframework.data.domain.PageRequest.of(0, pageSize);

        List<BookListResponse> personalizedList = mapHitsToResponses(
                bookService.search(
                        null,
                        preferences.categories().isEmpty() ? null : preferences.categories(),
                        preferences.tags().isEmpty() ? null : preferences.tags(),
                        null,
                        null,
                        null,
                        null,
                        false,
                        BookSort.BEST_RATED,
                        pageable),
                excludeBookIds,
                effectiveLimit);

        if (!personalizedList.isEmpty()) {
            recordRecommendationMetrics(personalizedList.size(), personalizedList.size() < effectiveLimit, excludeBookIds.size(), true, userId != null);
            sample.stop(meterRegistry.timer("books.recommendations.latency", "personalized", String.valueOf(personalized), "userId", userId == null ? "anonymous" : "known"));
            return personalizedList;
        }

        // Fallback: top-rated global, ainda respeitando exclusões
        List<BookListResponse> fallback = mapHitsToResponses(
                bookService.search(null, null, null, null, null, null, null, false, BookSort.BEST_RATED, pageable),
                excludeBookIds,
                effectiveLimit);

        recordRecommendationMetrics(fallback.size(), fallback.size() < effectiveLimit, excludeBookIds.size(), personalized, userId != null);
        sample.stop(meterRegistry.timer("books.recommendations.latency", "personalized", String.valueOf(personalized), "userId", userId == null ? "anonymous" : "known"));
        return fallback;
    }

    private void recordRecommendationMetrics(int delivered,
                                             boolean truncated,
                             int excluded,
                             boolean personalized,
                             boolean userKnown) {
        meterRegistry.counter("books.recommendations.count",
                "delivered", String.valueOf(delivered),
                "truncated", String.valueOf(truncated),
                "personalized", String.valueOf(personalized),
            "user", userKnown ? "known" : "anonymous",
            "excluded", String.valueOf(excluded))
                .increment();
    }

    private List<BookListResponse> mapHitsToResponses(Page<BookSearchHit> hits, Set<UUID> excludeBookIds, int limit) {
        List<UUID> bookIds = hits.map(BookSearchHit::bookId).toList();
        List<Book> books = bookService.findByIds(bookIds);
        Map<UUID, Book> bookMap = books.stream().collect(Collectors.toMap(Book::getId, b -> b));

        List<BookListResponse> responses = new ArrayList<>();
        for (BookSearchHit hit : hits) {
            if (excludeBookIds.contains(hit.bookId())) {
                continue;
            }
            Book book = bookMap.get(hit.bookId());
            if (book == null) {
                continue;
            }
            BookAverageRating rating = new BookAverageRating(hit.bookId(), hit.averageRating(), hit.totalReviews());
            responses.add(BookResponseMapper.toBookListResponse(book, rating));
            if (responses.size() >= limit) {
                break;
            }
        }
        return responses;
    }

    private Set<UUID> collectExcludedBooks(UUID userId) {
        if (userId == null) {
            return Set.of();
        }
        List<Reading> readings = readingService.findReadingsByUser(userId);
        Set<UUID> excluded = readings.stream()
                .map(Reading::getBook)
                .filter(Objects::nonNull)
                .map(Book::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        return excluded;
    }

    private record UserPreferences(List<UUID> categories, List<UUID> tags) {}

    private UserPreferences buildPreferences(UUID userId, int maxCategories, int maxTags) {
        if (userId == null) {
            return new UserPreferences(List.of(), List.of());
        }

        List<Favorite> favorites = favoriteService.findFavoritesByUser(userId);
        List<Reading> readings = readingService.findReadingsByUser(userId);

        Set<UUID> bookIds = new HashSet<>();
        favorites.stream()
                .map(Favorite::getBook)
                .filter(Objects::nonNull)
                .map(Book::getId)
                .filter(Objects::nonNull)
                .forEach(bookIds::add);
        readings.stream()
                .map(Reading::getBook)
                .filter(Objects::nonNull)
                .map(Book::getId)
                .filter(Objects::nonNull)
                .forEach(bookIds::add);

        if (bookIds.isEmpty()) {
            return new UserPreferences(List.of(), List.of());
        }

        List<Book> books = bookService.findByIds(bookIds);

        Map<UUID, Long> categoryCounts = books.stream()
                .filter(Objects::nonNull)
                .flatMap(b -> b.getCategories() == null ? Stream.empty() : b.getCategories().stream())
                .collect(Collectors.groupingBy(Category::getId, Collectors.counting()));

        Map<UUID, Long> tagCounts = books.stream()
                .filter(Objects::nonNull)
                .flatMap(b -> b.getTags() == null ? Stream.empty() : b.getTags().stream())
                .collect(Collectors.groupingBy(com.unichristus.libraryapi.domain.tag.Tag::getId, Collectors.counting()));

        List<UUID> preferredCategories = categoryCounts.entrySet().stream()
                .sorted(Map.Entry.<UUID, Long>comparingByValue().reversed())
                .limit(maxCategories)
                .map(Map.Entry::getKey)
                .toList();

        List<UUID> preferredTags = tagCounts.entrySet().stream()
                .sorted(Map.Entry.<UUID, Long>comparingByValue().reversed())
                .limit(maxTags)
                .map(Map.Entry::getKey)
                .toList();

        return new UserPreferences(preferredCategories, preferredTags);
    }
}
