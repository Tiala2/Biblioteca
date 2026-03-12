package com.unichristus.libraryapi.domain.reading;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReadingGoalMetrics(
        BigDecimal progressPercent,
        int remainingPages,
        LocalDate projectedEndDate,
        Integer expiresInDays,
        boolean paceWarning
) {
}
