package com.unichristus.libraryapi.domain.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.reading.exception.*;
import com.unichristus.libraryapi.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReadingService {

    private final ReadingRepository readingRepository;

    private Reading save(Reading reading) {
        return readingRepository.save(reading);
    }

    public List<Reading> findReadingsByUser(UUID userId) {
        return readingRepository.findReadingsByUserOrderByLastReadedAtDesc(userId);
    }

    public Optional<Reading> findInProgressReadingByUserAndBook(UUID userId, Book book) {
        return readingRepository.findReadingByUserAndBookAndStatus(userId, book, ReadingStatus.IN_PROGRESS);
    }

    public boolean hasInProgressReading(UUID userId, Book book) {
        return readingRepository.existsByUserIdAndBookAndStatus(userId, book, ReadingStatus.IN_PROGRESS);
    }

    public Optional<Reading> findReadindInProgress(UUID userId, Book book) {
        return readingRepository.findReadingByUserAndBookAndStatus(userId, book, ReadingStatus.IN_PROGRESS);
    }

    public Reading findReadingInProgressOrCreateReading(UUID userId, Book book) {
        return findReadindInProgress(userId, book)
                .orElseGet(() -> createReading(userId, book));
    }

    private Reading createReading(UUID userId, Book book) throws PdfNotAvailableException {
        if (!book.isHasPdf()) {
            throw new PdfNotAvailableException(book.getId());
        }
        LocalDateTime now = LocalDateTime.now();
        if (hasInProgressReading(userId, book)) {
            throw new ReadingInProgressException(userId, book.getId());
        }
        Reading reading = Reading.builder()
                .book(book)
                .user(User.builder().id(userId).build())
                .status(ReadingStatus.IN_PROGRESS)
                .currentPage(1)
                .startedAt(now)
                .lastReadedAt(now)
                .build();
        return save(reading);
    }

    public void updateReadingProgress(Reading reading, Integer newPage) {
        validateReadingNotFinished(reading);
        validatePageProgress(reading, newPage);
        Integer bookTotalPages = reading.getBook().getNumberOfPages();
        if (newPage >= bookTotalPages) {
            finishReading(reading);
        } else {
            reading.setCurrentPage(newPage);
            reading.setLastReadedAt(LocalDateTime.now());
        }
        save(reading);
    }

    private void validateReadingNotFinished(Reading reading) {
        if (reading.getStatus() == ReadingStatus.FINISHED) {
            throw new ReadingAlreadyFinishedException(reading.getId());
        }
    }

    private void validatePageProgress(Reading reading, int newPage) {
        int current = reading.getCurrentPage();
        int total = reading.getBook().getNumberOfPages();
        if (newPage < current) {
            throw new PageLowerException();
        }
        if (newPage > total) {
            throw new PageExceededException();
        }
    }

    private void finishReading(Reading reading) {
        LocalDateTime now = LocalDateTime.now();
        reading.setStatus(ReadingStatus.FINISHED);
        reading.setCurrentPage(reading.getBook().getNumberOfPages());
        reading.setFinishedAt(now);
        reading.setLastReadedAt(now);
    }

    public static int calculateProgressPercentage(Reading reading) {
        Integer totalPages = reading.getBook().getNumberOfPages();
        Integer currentPage = reading.getCurrentPage();
        if (totalPages == null || totalPages == 0 || currentPage == null) {
            return 0;
        }
        double percentage = (currentPage.doubleValue() / totalPages.doubleValue()) * 100;
        return (int) Math.round(percentage);
    }

}
