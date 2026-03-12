package com.unichristus.libraryapi.domain.engagement;

import java.util.UUID;

public record LeaderboardEntry(UUID userId, String userName, Long value) {
}
