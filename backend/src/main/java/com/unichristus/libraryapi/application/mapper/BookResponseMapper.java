package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.BookListResponse;
import com.unichristus.libraryapi.application.dto.response.BookPdfResponse;
import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.application.mapper.TagResponseMapper;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class BookResponseMapper {

    public static BookResponse toBookResponse(Book book) {
        if (book == null) return null;
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .numberOfPages(book.getNumberOfPages())
                .publicationDate(book.getPublicationDate())
                .coverUrl(book.getCoverUrl())
                .hasPdf(book.isHasPdf())
                .source(book.getSource())
                .categories(book.getCategories() == null ? null : book.getCategories().stream()
                        .map(CategoryResponseMapper::toLowResponse)
                        .toList())
                .tags(book.getTags() == null ? null : book.getTags().stream()
                        .map(TagResponseMapper::toResponse)
                        .toList())
                .build();
    }

    public static BookListResponse toBookListResponse(Book book, BookAverageRating averageRating) {
        if (book == null) return null;
        BookAverageRating rating = averageRating != null
                ? averageRating
                : new BookAverageRating(book.getId(), 0.0, 0L);
        return BookListResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .numberOfPages(book.getNumberOfPages())
                .publicationDate(book.getPublicationDate())
                .coverUrl(book.getCoverUrl())
                .hasPdf(book.isHasPdf())
                .source(book.getSource())
                .categories(book.getCategories() == null ? null : book.getCategories().stream()
                        .map(CategoryResponseMapper::toLowResponse)
                        .toList())
                .tags(book.getTags() == null ? null : book.getTags().stream()
                        .map(TagResponseMapper::toResponse)
                        .toList())
                .averageRating(rating.averageRating())
                .totalReviews(rating.totalReviews())
                .build();
    }

    public static BookPdfResponse toBookPdfResponse(Book book, String pdfUrl, BookAverageRating averageRating) {
        if (book == null) return null;
        BookAverageRating rating = averageRating != null
                ? averageRating
                : new BookAverageRating(book.getId(), 0.0, 0L);
        return BookPdfResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .numberOfPages(book.getNumberOfPages())
                .publicationDate(book.getPublicationDate())
                .pdfUrl(pdfUrl)
                .coverUrl(book.getCoverUrl())
                .hasPdf(book.isHasPdf() && pdfUrl != null)
                .source(book.getSource())
                .categories(book.getCategories() == null ? null : book.getCategories().stream()
                        .map(CategoryResponseMapper::toLowResponse)
                        .toList())
                .tags(book.getTags() == null ? null : book.getTags().stream()
                        .map(TagResponseMapper::toResponse)
                        .toList())
                .averageRating(rating.averageRating())
                .totalReviews(rating.totalReviews())
                .build();
    }

}
