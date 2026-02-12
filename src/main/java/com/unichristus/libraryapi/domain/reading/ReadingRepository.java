package com.unichristus.libraryapi.domain.reading;

import com.unichristus.libraryapi.domain.book.Book;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingRepository {

    Reading save(Reading reading);

    List<Reading> findReadingsByUserOrderByLastReadedAtDesc(UUID userid);

    boolean existsByUserIdAndBookAndStatus(UUID userId, Book book, ReadingStatus status);

    Optional<Reading> findReadingByUserAndBookAndStatus(UUID userId, Book book, ReadingStatus status);

}
