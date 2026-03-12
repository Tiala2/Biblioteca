package com.unichristus.libraryapi.application.dto.response;

import java.time.LocalDateTime;

public record ReadingProgressResponse(
        ReadingGoalResponse goal,
        int streakDays,
        int pagesReadThisWeek,
        int sessionsThisWeek,
        LocalDateTime lastSessionAt
) {
}
