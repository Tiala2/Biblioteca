package com.unichristus.libraryapi.infrastructure.persistence.favorite;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.favorite.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavoriteJpaRepository extends JpaRepository<Favorite, UUID> {
    List<Favorite> findAllByUserId(UUID userId);

    boolean existsByUserIdAndBook(UUID userId, Book book);

    void deleteByUserIdAndBook(UUID userId, Book book);
}
