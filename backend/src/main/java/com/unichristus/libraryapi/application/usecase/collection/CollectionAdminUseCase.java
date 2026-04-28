package com.unichristus.libraryapi.application.usecase.collection;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.CollectionUpsertRequest;
import com.unichristus.libraryapi.application.dto.response.CollectionResponse;
import com.unichristus.libraryapi.application.mapper.CollectionResponseMapper;
import com.unichristus.libraryapi.application.util.RequestTextNormalizer;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.book.exception.BookNotFoundException;
import com.unichristus.libraryapi.domain.collection.BookCollection;
import com.unichristus.libraryapi.domain.collection.BookCollectionService;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.review.ReviewService;
import lombok.RequiredArgsConstructor;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
public class CollectionAdminUseCase {

    private final BookCollectionService bookCollectionService;
    private final BookService bookService;
    private final ReviewService reviewService;

    public CollectionResponse createCollection(CollectionUpsertRequest request) {
        BookCollection collection = new BookCollection();
        applyRequest(collection, request);
        BookCollection saved = bookCollectionService.save(collection);
        return toResponse(saved);
    }

    public CollectionResponse updateCollection(UUID id, CollectionUpsertRequest request) {
        BookCollection collection = bookCollectionService.findByIdOrThrow(id);
        applyRequest(collection, request);
        BookCollection saved = bookCollectionService.save(collection);
        return toResponse(saved);
    }

    public void deleteCollection(UUID id) {
        bookCollectionService.delete(id);
    }

    private void applyRequest(BookCollection collection, CollectionUpsertRequest request) {
        List<UUID> bookIds = request.bookIds() == null ? List.of() : request.bookIds();
        List<Book> books = bookService.findByIds(bookIds);
        if (books.size() != bookIds.size()) {
            Set<UUID> foundIds = books.stream().map(Book::getId).collect(Collectors.toSet());
            UUID missingId = bookIds.stream().filter(id -> !foundIds.contains(id)).findFirst().orElse(null);
            throw new BookNotFoundException(missingId);
        }

        collection.setTitle(RequestTextNormalizer.normalizeRequired(request.title()));
        collection.setDescription(RequestTextNormalizer.normalizeOptional(request.description()));
        collection.setCoverUrl(request.coverUrl());
        collection.setBooks(new HashSet<>(books));
    }

    private CollectionResponse toResponse(BookCollection collection) {
        Map<UUID, BookAverageRating> ratings = loadRatings(List.of(collection));
        return CollectionResponseMapper.toResponse(collection, ratings);
    }

    private Map<UUID, BookAverageRating> loadRatings(List<BookCollection> collections) {
        Set<UUID> bookIds = collections.stream()
                .flatMap(c -> c.getBooks().stream())
                .map(Book::getId)
                .collect(Collectors.toSet());
        if (bookIds.isEmpty()) {
            return Map.of();
        }
        return reviewService.getAverageReviewsByBookIds(bookIds.stream().toList())
                .stream()
                .collect(Collectors.toMap(BookAverageRating::bookId, rating -> rating));
    }
}
