package com.unichristus.libraryapi.domain.engagement;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class InMemoryEngagementEventPublisher implements EngagementEventPublisher {

    private final BadgeService badgeService;

    @Override
    public void readingCompleted(UUID userId) {
        badgeService.awardOnReadingCompleted(userId);
    }

    @Override
    public void streakUpdated(UUID userId, int streakDays) {
        badgeService.awardOnStreakUpdated(userId, streakDays);
    }

    @Override
    public void readingProgressed(UUID userId) {
        badgeService.awardOnReadingProgress(userId);
    }
}
