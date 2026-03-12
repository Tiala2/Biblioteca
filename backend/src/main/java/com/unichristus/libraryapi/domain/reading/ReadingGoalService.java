package com.unichristus.libraryapi.domain.reading;

import com.unichristus.libraryapi.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumSet;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReadingGoalService {

    private final ReadingGoalRepository repository;
    private final ReadingSessionRepository readingSessionRepository;

    @Transactional
    public ReadingGoal upsertGoal(UUID userId, GoalPeriod period, int targetPages) {
        LocalDate today = LocalDate.now();
        DateRange range = calculateRange(period, today);

        Optional<ReadingGoal> active = repository.findActiveByUserAndPeriod(userId, period, today);
        if (active.isPresent() && isSameRange(active.get(), range)) {
            ReadingGoal goal = active.get();
            goal.setTargetPages(targetPages);
            if (goal.getProgressPages() >= targetPages) {
                goal.setStatus(GoalStatus.COMPLETED);
            }
            return repository.save(goal);
        }

        int baseProgress = initialProgress(userId, range);
        ReadingGoal goal = ReadingGoal.builder()
            .user(User.builder().id(userId).build())
            .period(period)
            .targetPages(targetPages)
            .progressPages(baseProgress)
            .startDate(range.start())
            .endDate(range.end())
            .status(initialStatus(targetPages, baseProgress))
            .build();
        return repository.save(goal);
    }

    @Transactional
    public void addProgressToActiveGoals(UUID userId, int pagesRead) {
        if (pagesRead <= 0) return;
        LocalDate today = LocalDate.now();
        for (GoalPeriod period : EnumSet.allOf(GoalPeriod.class)) {
            repository.findActiveByUserAndPeriod(userId, period, today).ifPresent(goal -> {
                // expire if window passou
                if (today.isAfter(goal.getEndDate())) {
                    goal.setStatus(GoalStatus.EXPIRED);
                    repository.save(goal);
                    return;
                }

                int newProgress = goal.getProgressPages() + pagesRead;
                goal.setProgressPages(newProgress);
                if (newProgress >= goal.getTargetPages()) {
                    goal.setStatus(GoalStatus.COMPLETED);
                }
                repository.save(goal);
            });
        }
    }

    public Optional<ReadingGoal> findActiveGoal(UUID userId, GoalPeriod period) {
        LocalDate today = LocalDate.now();
        return repository.findActiveByUserAndPeriod(userId, period, today);
    }

    public ReadingGoalMetrics calculateMetrics(UUID userId, ReadingGoal goal) {
        int target = goal.getTargetPages() == null ? 0 : goal.getTargetPages();
        int progress = goal.getProgressPages() == null ? 0 : goal.getProgressPages();
        int remaining = Math.max(0, target - progress);

        BigDecimal percent = target > 0
                ? BigDecimal.valueOf(progress * 100.0 / target).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);

        LocalDate projected = null;
        boolean paceWarning = false;
        LocalDate today = LocalDate.now();
        Integer expiresInDays = today.isAfter(goal.getEndDate()) ? 0 : (int) ChronoUnit.DAYS.between(today, goal.getEndDate());

        if (remaining > 0 && goal.getStatus() == GoalStatus.ACTIVE) {
            long daysElapsed = Math.max(1, ChronoUnit.DAYS.between(goal.getStartDate(), today) + 1);
            int pagesInWindow = readingSessionRepository.sumPagesByUserBetween(
                    userId,
                    goal.getStartDate().atStartOfDay(),
                    today.plusDays(1).atStartOfDay()
            );
            BigDecimal avgPerDay = pagesInWindow > 0
                    ? BigDecimal.valueOf(pagesInWindow)
                        .divide(BigDecimal.valueOf(daysElapsed), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            if (avgPerDay.compareTo(BigDecimal.ZERO) > 0) {
                int daysNeeded = (int) Math.ceil(remaining / avgPerDay.doubleValue());
                projected = today.plusDays(daysNeeded);
                if (projected.isAfter(goal.getEndDate())) {
                    paceWarning = true;
                    projected = goal.getEndDate();
                }
            } else {
                paceWarning = true; // sem ritmo ainda
            }
        }

        return new ReadingGoalMetrics(percent, remaining, projected, expiresInDays, paceWarning);
    }

    private boolean isSameRange(ReadingGoal goal, DateRange range) {
        return goal.getStartDate().equals(range.start()) && goal.getEndDate().equals(range.end());
    }

    private DateRange calculateRange(GoalPeriod period, LocalDate today) {
        return switch (period) {
            case WEEKLY -> {
                LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate end = start.plusDays(6);
                yield new DateRange(start, end);
            }
            case MONTHLY -> {
                LocalDate start = today.withDayOfMonth(1);
                LocalDate end = start.with(TemporalAdjusters.lastDayOfMonth());
                yield new DateRange(start, end);
            }
        };
    }

    private int initialProgress(UUID userId, DateRange range) {
        LocalDateTime start = range.start().atStartOfDay();
        LocalDateTime endExclusive = range.end().plusDays(1).atStartOfDay();
        return readingSessionRepository.sumPagesByUserBetween(userId, start, endExclusive);
    }

    private GoalStatus initialStatus(int targetPages, int progress) {
        if (progress >= targetPages) {
            return GoalStatus.COMPLETED;
        }
        return GoalStatus.ACTIVE;
    }

    private record DateRange(LocalDate start, LocalDate end) {}
}
