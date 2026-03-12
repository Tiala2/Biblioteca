package com.unichristus.libraryapi.application.usecase.book;

import com.unichristus.libraryapi.domain.book.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.books.open-cache.cleanup", name = "enabled", havingValue = "true", matchIfMissing = true)
public class OpenLibraryCacheCleanupJob {

    private final BookService bookService;

    @org.springframework.beans.factory.annotation.Value("${app.books.open-cache.ttl-days:60}")
    private long ttlDays;

    @Scheduled(cron = "${app.books.open-cache.cleanup.cron:0 15 3 * * *}")
    public void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(Math.max(ttlDays, 1));
        long removed = bookService.deleteStaleOpenLibraryBooks(cutoff);
        if (removed > 0) {
            log.info("OpenLibrary cache cleanup removed {} stale book(s), cutoff={}", removed, cutoff);
        } else {
            log.debug("OpenLibrary cache cleanup removed 0 books, cutoff={}", cutoff);
        }
    }
}
