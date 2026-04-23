package com.unichristus.libraryapi.application.usecase.reading;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.notification.ReadingAlertNotifier;
import com.unichristus.libraryapi.application.dto.response.ReadingResponse;
import com.unichristus.libraryapi.application.mapper.ReadingResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.engagement.EngagementEventPublisher;
import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingGoalService;
import com.unichristus.libraryapi.domain.reading.ReadingSessionService;
import com.unichristus.libraryapi.domain.reading.ReadingService;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class ReadingUseCase {

    private final ReadingService readingService;
    private final BookService bookService;
    private final ReadingSessionService readingSessionService;
    private final ReadingGoalService readingGoalService;
    private final EngagementEventPublisher engagementEventPublisher;
    private final ReadingGoalUseCase readingGoalUseCase;
    private final UserService userService;
    private final ReadingAlertNotifier readingAlertNotifier;

    public ReadingResponse syncReading(UUID userId, UUID bookId, Integer currentPage) {
        Reading reading = findReadingInProgressOrCreateReading(userId, bookId);
        int previousPage = reading.getCurrentPage();
        Reading updated = readingService.updateReadingProgress(reading, currentPage);
        int pagesRead = Math.max(0, updated.getCurrentPage() - previousPage);
        if (pagesRead > 0) {
            readingSessionService.registerSession(userId, updated.getBook(), pagesRead);
            readingGoalService.addProgressToActiveGoals(userId, pagesRead);
        }
        if (updated.getStatus() == ReadingStatus.FINISHED) {
            engagementEventPublisher.readingCompleted(userId);
        }
        notifyReadingAlertsIfEnabled(userId);
        return ReadingResponseMapper.toReadingResponse(updated);
    }

    public Reading findReadingInProgressOrCreateReading(UUID userId, UUID bookId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        return readingService.findReadingInProgressOrCreateReading(userId, book);
    }

    public List<ReadingResponse> listUserReadings(UUID userId) {
        return readingService.findReadingsByUser(userId).stream()
                .map(ReadingResponseMapper::toReadingResponse)
                .toList();
    }

    private void notifyReadingAlertsIfEnabled(UUID userId) {
        User user = userService.findUserByIdOrThrow(userId);
        if (!Boolean.TRUE.equals(user.getAlertsOptIn())) {
            return;
        }
        readingAlertNotifier.notifyUser(
                userId,
                user.getEmail(),
                readingGoalUseCase.listAlerts(userId, GoalPeriod.MONTHLY)
        );
    }

}
