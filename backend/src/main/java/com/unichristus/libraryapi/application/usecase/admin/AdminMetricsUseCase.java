package com.unichristus.libraryapi.application.usecase.admin;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.AdminMetricsResponse;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.collection.BookCollectionService;
import com.unichristus.libraryapi.domain.favorite.FavoriteService;
import com.unichristus.libraryapi.domain.review.ReviewService;
import com.unichristus.libraryapi.domain.tag.TagService;
import com.unichristus.libraryapi.domain.user.UserService;
import lombok.RequiredArgsConstructor;

@UseCase
@RequiredArgsConstructor
public class AdminMetricsUseCase {

    private final UserService userService;
    private final BookService bookService;
    private final ReviewService reviewService;
    private final FavoriteService favoriteService;
    private final BookCollectionService bookCollectionService;
    private final TagService tagService;

    public AdminMetricsResponse getMetrics() {
        return new AdminMetricsResponse(
                userService.count(),
                bookService.count(),
                reviewService.count(),
                favoriteService.count(),
                bookCollectionService.count(),
                tagService.count()
        );
    }
}
