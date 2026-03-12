package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import com.unichristus.libraryapi.domain.reading.GoalStatus;

import java.time.LocalDate;
import java.math.BigDecimal;

public record ReadingGoalResponse(
        GoalPeriod period,
        Integer targetPages,
        Integer progressPages,
        BigDecimal progressPercent,
        Integer remainingPages,
        LocalDate projectedEndDate,
        Integer expiresInDays,
        boolean paceWarning,
        GoalStatus status,
        LocalDate startDate,
        LocalDate endDate
) {
}
