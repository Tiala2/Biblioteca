package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.BookCreateRequest;
import com.unichristus.libraryapi.application.dto.request.BookUpdateRequest;
import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.application.mapper.BookResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.category.Category;
import com.unichristus.libraryapi.domain.category.CategoryService;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import com.unichristus.libraryapi.domain.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
public class BookUseCase {

    private final BookService bookService;
    private final CategoryService categoryService;
    private final ReviewService reviewService;

    public Page<BookResponse> getAllBooks(Pageable pageable) {
        Page<Book> books = bookService.findAllAvailable(pageable);
        List<UUID> bookIds = books.map(Book::getId).toList();
        List<BookAverageRating> averageRatings = reviewService.getAverageReviewsByBookIds(bookIds);

        Map<UUID, BookAverageRating> ratingMap = averageRatings.stream()
                .collect(Collectors.toMap(BookAverageRating::bookId, r -> r));
        return books.map(book -> {
            BookAverageRating averageRating = ratingMap.getOrDefault(book.getId(), new BookAverageRating(book.getId(), 0.0, 0L));
            return BookResponseMapper.toBookListResponse(book, averageRating);
        });
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
}
