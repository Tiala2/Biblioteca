package com.unichristus.libraryapi.domain.reading;

import com.unichristus.libraryapi.domain.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class ReadingGoalServiceTest {

    @Mock
    private ReadingGoalRepository readingGoalRepository;

    @Mock
    private ReadingSessionRepository readingSessionRepository;

    private ReadingGoalService service;

    @BeforeEach
    void setUp() {
        service = new ReadingGoalService(readingGoalRepository, readingSessionRepository);
    }

    @Test
    void calculateMetricsShouldReturnProgressAndProjection() {
        UUID userId = UUID.randomUUID();
        LocalDate start = LocalDate.now().minusDays(4);
        LocalDate end = LocalDate.now().plusDays(10);

        ReadingGoal goal = ReadingGoal.builder()
                .id(UUID.randomUUID())
                .user(User.builder().id(userId).build())
                .period(GoalPeriod.MONTHLY)
                .targetPages(200)
                .progressPages(50)
                .startDate(start)
                .endDate(end)
                .status(GoalStatus.ACTIVE)
                .build();

        // 100 pages over 5 days -> 20 pages/day, remaining 150 => 8 days needed
        when(readingSessionRepository.sumPagesByUserBetween(any(), any(), any())).thenReturn(100);

        ReadingGoalMetrics metrics = service.calculateMetrics(userId, goal);

        assertThat(metrics.progressPercent()).isEqualByComparingTo("25.0");
        assertThat(metrics.remainingPages()).isEqualTo(150);
        assertThat(metrics.projectedEndDate()).isEqualTo(LocalDate.now().plusDays(8));
        assertThat(metrics.expiresInDays()).isGreaterThanOrEqualTo(0);
        assertThat(metrics.paceWarning()).isFalse();
    }

    @Test
    void calculateMetricsShouldReturnNullProjectionWhenNoPace() {
        UUID userId = UUID.randomUUID();
        LocalDate start = LocalDate.now().minusDays(2);
        LocalDate end = LocalDate.now().plusDays(5);

        ReadingGoal goal = ReadingGoal.builder()
                .id(UUID.randomUUID())
                .user(User.builder().id(userId).build())
                .period(GoalPeriod.WEEKLY)
                .targetPages(100)
                .progressPages(0)
                .startDate(start)
                .endDate(end)
                .status(GoalStatus.ACTIVE)
                .build();

        when(readingSessionRepository.sumPagesByUserBetween(any(), any(), any())).thenReturn(0);

        ReadingGoalMetrics metrics = service.calculateMetrics(userId, goal);

        assertThat(metrics.progressPercent()).isEqualByComparingTo("0.0");
        assertThat(metrics.remainingPages()).isEqualTo(100);
        assertThat(metrics.projectedEndDate()).isNull();
        assertThat(metrics.paceWarning()).isTrue();
    }
}
