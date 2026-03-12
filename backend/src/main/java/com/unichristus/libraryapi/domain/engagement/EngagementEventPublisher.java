package com.unichristus.libraryapi.domain.engagement;

import java.util.UUID;

public interface EngagementEventPublisher {
    void readingCompleted(UUID userId);
    void streakUpdated(UUID userId, int streakDays);
    void readingProgressed(UUID userId);
}
