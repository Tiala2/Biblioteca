package com.unichristus.libraryapi.application.usecase.collection;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.CollectionResponse;
import com.unichristus.libraryapi.application.mapper.CollectionResponseMapper;
import com.unichristus.libraryapi.domain.collection.BookCollection;
import com.unichristus.libraryapi.domain.collection.BookCollectionService;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
public class CollectionUseCase {

    private final BookCollectionService bookCollectionService;
    private final ReviewService reviewService;

    public Page<CollectionResponse> listCollections(Pageable pageable) {
        Page<BookCollection> page = bookCollectionService.findAll(pageable);
        Map<UUID, BookAverageRating> ratings = loadRatings(page.getContent());
        List<CollectionResponse> responses = page.getContent().stream()
                .map(collection -> CollectionResponseMapper.toResponse(collection, ratings))
                .toList();
        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    public CollectionResponse getCollection(UUID id) {
        BookCollection collection = bookCollectionService.findByIdOrThrow(id);
        Map<UUID, BookAverageRating> ratings = loadRatings(List.of(collection));
        return CollectionResponseMapper.toResponse(collection, ratings);
    }

    private Map<UUID, BookAverageRating> loadRatings(List<BookCollection> collections) {
        Set<UUID> bookIds = collections.stream()
                .flatMap(c -> c.getBooks().stream())
                .map(b -> b.getId())
                .collect(Collectors.toSet());
        if (bookIds.isEmpty()) {
            return Map.of();
        }
        return reviewService.getAverageReviewsByBookIds(bookIds.stream().toList())
                .stream()
                .collect(Collectors.toMap(BookAverageRating::bookId, r -> r));
    }
}
