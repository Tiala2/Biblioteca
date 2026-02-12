package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingRepository;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ReadingRepositoryImpl implements ReadingRepository {

    private final ReadingJpaRepository repository;


    @Override
    public Reading save(Reading reading) {
        return repository.save(reading);
    }

    @Override
    public List<Reading> findReadingsByUserOrderByLastReadedAtDesc(UUID userid) {
        return repository.findReadingsByUserOrderByLastReadedAtDesc(userid);
    }

    @Override
    public boolean existsByUserIdAndBookAndStatus(UUID userId, Book book, ReadingStatus status) {
        return repository.existsByUserIdAndBookAndStatus(userId, book, status);
    }

    @Override
    public Optional<Reading> findReadingByUserAndBookAndStatus(UUID userId, Book book, ReadingStatus status) {
        return repository.findReadingByUserAndBookAndStatus(userId, book, status);
    }
}
