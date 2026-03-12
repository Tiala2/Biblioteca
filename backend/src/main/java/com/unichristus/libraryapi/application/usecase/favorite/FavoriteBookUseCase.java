package com.unichristus.libraryapi.application.usecase.favorite;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.FavoriteResponse;
import com.unichristus.libraryapi.application.mapper.FavoriteResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.favorite.Favorite;
import com.unichristus.libraryapi.domain.favorite.FavoriteService;
import com.unichristus.libraryapi.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class FavoriteBookUseCase {

    private final BookService bookService;
    private final FavoriteService favoriteService;

    public List<FavoriteResponse> getUserFavorites(UUID userId) {
        return favoriteService.findFavoritesByUser(userId).stream()
                .map(FavoriteResponseMapper::toFavoriteResponse)
                .toList();
    }

    public Page<FavoriteResponse> getAll(Pageable pageable) {
        return favoriteService.findAll(pageable)
                .map(FavoriteResponseMapper::toFavoriteResponse);
    }

    public FavoriteResponse favoriteBook(UUID bookId, UUID userId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        User user = User.builder().id(userId).build();
        Favorite favorite = favoriteService.createFavorite(book, user);
        return FavoriteResponseMapper.toFavoriteResponse(favorite);
    }

    public void unfavoriteBook(UUID bookId, UUID userId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        favoriteService.unfavoriteBook(book, userId);
    }

    public boolean isFavorite(UUID bookId, UUID userId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        return favoriteService.isFavorite(book, userId);
    }
}
