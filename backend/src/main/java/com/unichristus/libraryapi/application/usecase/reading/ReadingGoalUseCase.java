package com.unichristus.libraryapi.application.usecase.reading;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.ReadingGoalRequest;
import com.unichristus.libraryapi.application.notification.ReadingAlertNotifier;
import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.application.dto.response.AlertSeverity;
import com.unichristus.libraryapi.application.dto.response.AlertType;
import com.unichristus.libraryapi.application.dto.response.ReadingGoalResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingGoalSummaryResponse;
import com.unichristus.libraryapi.application.dto.response.StreakResponse;
import com.unichristus.libraryapi.domain.reading.ReadingGoal;
import com.unichristus.libraryapi.domain.reading.ReadingGoalService;
import com.unichristus.libraryapi.domain.reading.ReadingSessionService;
import com.unichristus.libraryapi.domain.reading.ReadingGoalMetrics;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@UseCase
@RequiredArgsConstructor
public class ReadingGoalUseCase {

    private final ReadingGoalService readingGoalService;
    private final ReadingSessionService readingSessionService;
    private final UserService userService;
    private final ReadingAlertNotifier readingAlertNotifier;

    public ReadingGoalResponse upsertGoal(UUID userId, ReadingGoalRequest request) {
        ReadingGoal goal = readingGoalService.upsertGoal(userId, request.period(), request.targetPages());
        ReadingGoalResponse response = toResponse(userId, goal);
        notifyReadingAlertsIfEnabled(userId, request.period());
        return response;
    }

    public ReadingGoalResponse getCurrentGoal(UUID userId, com.unichristus.libraryapi.domain.reading.GoalPeriod period) {
        return readingGoalService.findActiveGoal(userId, period)
                .map(goal -> toResponse(userId, goal))
                .orElse(null);
    }

    public StreakResponse getStreak(UUID userId) {
        int streak = readingSessionService.calculateCurrentStreakDays(userId);
        return new StreakResponse(streak);
    }

    public ReadingGoalSummaryResponse getGoalSummary(UUID userId, com.unichristus.libraryapi.domain.reading.GoalPeriod period) {
        ReadingGoalResponse goal = getCurrentGoal(userId, period);
        int streak = readingSessionService.calculateCurrentStreakDays(userId);
        List<AlertResponse> alerts = listAlerts(userId, period);
        return new ReadingGoalSummaryResponse(goal, streak, alerts);
    }

    public List<AlertResponse> listAlerts(UUID userId, com.unichristus.libraryapi.domain.reading.GoalPeriod period) {
        ReadingGoalResponse goal = getCurrentGoal(userId, period);
        int streak = readingSessionService.calculateCurrentStreakDays(userId);
        return buildAlerts(userId, goal, streak);
    }

    private ReadingGoalResponse toResponse(UUID userId, ReadingGoal goal) {
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
    }

    private List<AlertResponse> buildAlerts(UUID userId, ReadingGoalResponse goal, int streakDays) {
        boolean alertsOptIn = Boolean.TRUE.equals(userService.findUserByIdOrThrow(userId).getAlertsOptIn());
        if (!alertsOptIn) return List.of();

        List<AlertResponse> alerts = new ArrayList<>();

        if (goal != null && goal.expiresInDays() != null && goal.expiresInDays() <= 2
            && goal.remainingPages() != null && goal.remainingPages() > 0) {
            alerts.add(new AlertResponse(
                buildId(AlertType.GOAL_EXPIRING, goal),
                    AlertType.GOAL_EXPIRING,
                    AlertSeverity.WARNING,
                    "Meta " + goal.period() + " expira em " + goal.expiresInDays() + " dia(s).",
                    suggestedDailyPages(goal, AlertType.GOAL_EXPIRING)
            ));
        }

        if (goal != null && goal.paceWarning() && goal.remainingPages() != null && goal.remainingPages() > 0) {
            alerts.add(new AlertResponse(
                buildId(AlertType.PACE_WARNING, goal),
                    AlertType.PACE_WARNING,
                    AlertSeverity.INFO,
                    "Ajuste o ritmo: faltam " + goal.remainingPages() + " páginas antes do fim do período.",
                    suggestedDailyPages(goal, AlertType.PACE_WARNING)
            ));
        }

        if (streakDays == 0) {
            alerts.add(new AlertResponse(
                buildId(AlertType.NO_STREAK, goal),
                    AlertType.NO_STREAK,
                    AlertSeverity.INFO,
                    "Comece hoje para iniciar sua sequência de leitura.",
                    null
            ));
        }

        alerts.sort((a, b) -> {
            int severityOrder = b.severity().compareTo(a.severity()); // WARNING before INFO
            if (severityOrder != 0) return severityOrder;
            return a.type().compareTo(b.type());
        });

        if (alerts.size() > 3) {
            return alerts.subList(0, 3);
        }

        return alerts;
    }

    private String buildId(AlertType type, ReadingGoalResponse goal) {
        if (goal == null) return type.name();
        return type.name() + "-" + goal.period() + "-" + (goal.startDate() != null ? goal.startDate() : "");
    }

    private Integer suggestedDailyPages(ReadingGoalResponse goal, AlertType type) {
        if (goal == null || goal.remainingPages() == null || goal.remainingPages() <= 0 || goal.endDate() == null) {
            return null;
        }
        if (!(type == AlertType.GOAL_EXPIRING || type == AlertType.PACE_WARNING)) {
            return null;
        }
        LocalDate today = LocalDate.now();
        long daysLeft = Math.max(1, ChronoUnit.DAYS.between(today, goal.endDate()) + 1);
        return (int) Math.ceil(goal.remainingPages() / (double) daysLeft);
    }

    private void notifyReadingAlertsIfEnabled(UUID userId, com.unichristus.libraryapi.domain.reading.GoalPeriod period) {
        User user = userService.findUserByIdOrThrow(userId);
        if (!Boolean.TRUE.equals(user.getAlertsOptIn())) {
            return;
        }
        readingAlertNotifier.notifyUser(userId, user.getEmail(), listAlerts(userId, period));
    }
}
