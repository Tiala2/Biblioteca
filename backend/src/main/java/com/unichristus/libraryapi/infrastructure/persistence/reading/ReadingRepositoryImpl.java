package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingRepository;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.reading.exception.ReadingInProgressException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
        try {
            return repository.save(reading);
        } catch (DataIntegrityViolationException ex) {
            if (reading.getUser() != null && reading.getBook() != null && reading.getStatus() == ReadingStatus.IN_PROGRESS) {
                throw new ReadingInProgressException(reading.getUser().getId(), reading.getBook().getId());
            }
            throw ex;
        }
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

    @Override
    public long countByUserIdAndStatus(UUID userId, ReadingStatus status) {
        return repository.countByUserIdAndStatus(userId, status);
    }

    @Override
    public java.util.List<com.unichristus.libraryapi.domain.engagement.LeaderboardEntry> findFinishedLeaderboard(java.time.LocalDateTime after, int limit) {
        return repository.findFinishedLeaderboard(after, org.springframework.data.domain.PageRequest.of(0, limit));
    }
}
