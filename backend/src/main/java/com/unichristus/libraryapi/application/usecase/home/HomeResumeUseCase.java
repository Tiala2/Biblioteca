package com.unichristus.libraryapi.application.usecase.home;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.*;
import com.unichristus.libraryapi.application.mapper.CollectionResponseMapper;
import com.unichristus.libraryapi.application.mapper.ReadingResponseMapper;
import com.unichristus.libraryapi.application.mapper.ReviewResponseMapper;
import com.unichristus.libraryapi.application.mapper.BookResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.favorite.Favorite;
import com.unichristus.libraryapi.domain.favorite.FavoriteService;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingGoalService;
import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import com.unichristus.libraryapi.domain.reading.ReadingService;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.reading.ReadingSessionService;
import com.unichristus.libraryapi.domain.reading.ReadingGoalMetrics;
import com.unichristus.libraryapi.domain.review.ReviewService;
import com.unichristus.libraryapi.domain.collection.BookCollectionService;
import com.unichristus.libraryapi.domain.review.BookAverageRating;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
public class HomeResumeUseCase {

    private final ReadingService readingService;
    private final FavoriteService favoriteService;
    private final ReviewService reviewService;
    private final ReadingGoalService readingGoalService;
    private final ReadingSessionService readingSessionService;
    private final BookCollectionService bookCollectionService;
    private final BookService bookService;

    public HomeResponse resume(UUID userId) {
        List<Reading> readings = readingService.findReadingsByUser(userId);
        List<Book> favoriteBooks = favoriteService.findFavoritesByUser(userId)
                .stream()
                .map(Favorite::getBook)
                .toList();

        int totalPagesRead = 0;
        int totalFinished = 0;

        List<ReadingHomeResponse> inProgress = new ArrayList<>();

        for (Reading reading : readings) {
            if (reading.getStatus() == ReadingStatus.IN_PROGRESS) {
                boolean isFavorite = favoriteBooks.contains(reading.getBook());
                inProgress.add(ReadingResponseMapper.toReadingHomeResponse(reading, isFavorite));
            } else if (reading.getStatus() == ReadingStatus.FINISHED) {
                totalFinished++;
                totalPagesRead += reading.getCurrentPage();
            }
        }

        UserSummaryResponse summary = new UserSummaryResponse(inProgress.size(), totalFinished, totalPagesRead);
        List<ReviewHomeResponse> recentReviews = getRecentReviews();

        ReadingGoalResponse weeklyGoal = readingGoalService.findActiveGoal(userId, GoalPeriod.WEEKLY)
            .map(goal -> {
                ReadingGoalMetrics metrics = readingGoalService.calculateMetrics(userId, goal);
                return new ReadingGoalResponse(
                    goal.getPeriod(),
                    goal.getTargetPages(),
                    goal.getProgressPages(),
                    metrics.progressPercent(),
                    metrics.remainingPages(),
                    metrics.projectedEndDate(),
                        metrics.expiresInDays(),
                        metrics.paceWarning(),
                    goal.getStatus(),
                    goal.getStartDate(),
                    goal.getEndDate()
                );
            }).orElse(null);

        int streak = readingSessionService.calculateCurrentStreakDays(userId);
        ReadingProgressResponse progress = new ReadingProgressResponse(
                weeklyGoal,
                streak,
                calculatePagesReadThisWeek(userId),
                calculateSessionsThisWeek(userId),
                getLastSessionAt(userId)
        );

        List<BookAverageRating> topRatings = reviewService.getTopRatedBooks(8);
        Map<UUID, BookAverageRating> ratingsByBook = topRatings.stream()
            .collect(Collectors.toMap(BookAverageRating::bookId, r -> r));

        List<CollectionResponse> collections = buildCollections(ratingsByBook);
        List<BookListResponse> recommendations = buildRecommendations(topRatings, ratingsByBook);

        return new HomeResponse(summary, inProgress, progress, collections, recommendations, recentReviews);
    }

    private List<ReviewHomeResponse> getRecentReviews() {
        PageRequest pageRequest = PageRequest.of(
                0,
                10,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return reviewService.findAll(pageRequest)
                .map(ReviewResponseMapper::toReviewHomeResponse).toList();
    }

    private int calculatePagesReadThisWeek(UUID userId) {
        LocalDate startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDateTime start = startOfWeek.atStartOfDay();
        return readingSessionService.findByUserAfter(userId, start).stream()
                .mapToInt(s -> s.getPagesRead() == null ? 0 : s.getPagesRead())
                .sum();
    }

    private int calculateSessionsThisWeek(UUID userId) {
        LocalDate startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDateTime start = startOfWeek.atStartOfDay();
        return readingSessionService.findByUserAfter(userId, start).size();
    }

    private java.time.LocalDateTime getLastSessionAt(UUID userId) {
        return readingSessionService.findByUserOrdered(userId).stream()
                .findFirst()
                .map(com.unichristus.libraryapi.domain.reading.ReadingSession::getLoggedAt)
                .orElse(null);
    }

    private List<BookListResponse> buildRecommendations(List<BookAverageRating> topRatings, Map<UUID, BookAverageRating> ratingsByBook) {
        List<UUID> bookIds = topRatings.stream().map(BookAverageRating::bookId).toList();
        List<Book> books = bookService.findByIds(bookIds);
        Map<UUID, Book> bookMap = books.stream().collect(Collectors.toMap(Book::getId, b -> b));

        List<BookListResponse> responses = new ArrayList<>();
        for (BookAverageRating rating : topRatings) {
            Book book = bookMap.get(rating.bookId());
            if (book != null) {
                responses.add(BookResponseMapper.toBookListResponse(book, ratingsByBook.get(book.getId())));
            }
            if (responses.size() >= 6) break;
        }
        return responses;
    }

    private List<CollectionResponse> buildCollections(Map<UUID, BookAverageRating> ratingsByBook) {
        var collections = bookCollectionService.findLatest(4);

        List<UUID> missingIds = collections.stream()
            .flatMap(c -> c.getBooks().stream())
            .map(Book::getId)
            .filter(id -> !ratingsByBook.containsKey(id))
            .distinct()
            .toList();

        if (!missingIds.isEmpty()) {
            reviewService.getAverageReviewsByBookIds(missingIds)
                .forEach(rating -> ratingsByBook.put(rating.bookId(), rating));
        }

        return collections.stream()
            .map(collection -> CollectionResponseMapper.toResponse(collection, ratingsByBook))
            .toList();
    }

}
