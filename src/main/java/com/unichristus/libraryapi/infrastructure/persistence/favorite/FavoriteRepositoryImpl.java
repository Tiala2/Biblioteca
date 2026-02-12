package com.unichristus.libraryapi.infrastructure.persistence.favorite;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.favorite.Favorite;
import com.unichristus.libraryapi.domain.favorite.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class FavoriteRepositoryImpl implements FavoriteRepository {

    private final FavoriteJpaRepository favoriteJpaRepository;

    @Override
    public Favorite save(Favorite favorite) {
        return favoriteJpaRepository.save(favorite);
    }

    @Override
    public List<Favorite> findAllByUserId(UUID userId) {
        return favoriteJpaRepository.findAllByUserId(userId);
    }

    @Override
    public Page<Favorite> findAll(Pageable pageable) {
        return favoriteJpaRepository.findAll(pageable);
    }

    @Override
    public boolean existsByUserIdAndBook(UUID userId, Book book) {
        return favoriteJpaRepository.existsByUserIdAndBook(userId, book);
    }

    @Override
    public void deleteByUserIdAndBook(UUID userId, Book book) {
        favoriteJpaRepository.deleteByUserIdAndBook(userId, book);
    }
}
