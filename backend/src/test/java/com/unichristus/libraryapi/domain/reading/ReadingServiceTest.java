package com.unichristus.libraryapi.domain.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReadingServiceTest {

    @Mock
    private ReadingRepository readingRepository;

    private ReadingService readingService;

    @BeforeEach
    void setUp() {
        readingService = new ReadingService(readingRepository);
    }

    @Test
    void shouldCreateReadingForExternalBookWithoutPdf() {
        UUID userId = UUID.randomUUID();
        Book externalBook = Book.builder()
                .id(UUID.randomUUID())
                .title("Livro Externo")
                .numberOfPages(320)
                .hasPdf(false)
                .source(BookSource.OPEN)
                .build();

        when(readingRepository.findReadingByUserAndBookAndStatus(userId, externalBook, ReadingStatus.IN_PROGRESS))
                .thenReturn(Optional.empty());
        when(readingRepository.existsByUserIdAndBookAndStatus(userId, externalBook, ReadingStatus.IN_PROGRESS))
                .thenReturn(false);
        when(readingRepository.save(any(Reading.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Reading reading = readingService.findReadingInProgressOrCreateReading(userId, externalBook);

        assertThat(reading.getBook()).isEqualTo(externalBook);
        assertThat(reading.getCurrentPage()).isEqualTo(1);
        assertThat(reading.getStatus()).isEqualTo(ReadingStatus.IN_PROGRESS);
        assertThat(reading.getStartedAt()).isNotNull();
        assertThat(reading.getLastReadedAt()).isNotNull();
    }
}
