package com.unichristus.libraryapi.domain.favorite;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.favorite.exception.FavoriteAlreadyExistsException;
import com.unichristus.libraryapi.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public Page<Favorite> findAll(Pageable pageable) {
        return favoriteRepository.findAll(pageable);
    }

    public List<Favorite> findFavoritesByUser(UUID userId) {
        return favoriteRepository.findAllByUserId(userId);
    }

    public boolean isFavorite(Book book, UUID userId) {
        return favoriteRepository.existsByUserIdAndBook(userId, book);
    }

    public Favorite createFavorite(Book book, User user) {
        if (isFavorite(book, user.getId())) {
            throw new FavoriteAlreadyExistsException(user.getId(), book.getId());
        }
        Favorite favorite = Favorite.builder()
                .user(user)
                .book(book)
                .build();
        return favoriteRepository.save(favorite);
    }

    public void unfavoriteBook(Book book, UUID userId) {
        favoriteRepository.deleteByUserIdAndBook(userId, book);
    }
}