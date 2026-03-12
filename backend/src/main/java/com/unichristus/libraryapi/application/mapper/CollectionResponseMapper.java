package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.BookListResponse;
import com.unichristus.libraryapi.application.dto.response.CollectionResponse;
import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.domain.collection.BookCollection;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class CollectionResponseMapper {

    public static CollectionResponse toResponse(BookCollection collection, Map<UUID, BookAverageRating> ratings) {
        List<BookListResponse> books = collection.getBooks().stream()
                .sorted(Comparator.comparing(b -> b.getTitle().toLowerCase()))
                .map(book -> {
                    BookAverageRating rating = ratings.get(book.getId());
                    BookAverageRating safeRating = rating != null
                            ? rating
                            : new BookAverageRating(book.getId(), 0.0, 0L);
                    return BookResponseMapper.toBookListResponse(book, safeRating);
                })
                .toList();

        List<TagResponse> tags = aggregateTags(collection.getBooks());

        return new CollectionResponse(
                collection.getId(),
                collection.getTitle(),
                collection.getDescription(),
                collection.getCoverUrl(),
                tags,
                books
        );
    }

    private static List<TagResponse> aggregateTags(Set<com.unichristus.libraryapi.domain.book.Book> books) {
        if (books == null || books.isEmpty()) return List.of();
        return books.stream()
                .flatMap(book -> book.getTags() == null ? java.util.stream.Stream.empty() : book.getTags().stream())
                .collect(Collectors.toMap(
                        com.unichristus.libraryapi.domain.tag.Tag::getId,
                        TagResponseMapper::toResponse,
                        (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .sorted(Comparator.comparing(TagResponse::name, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
