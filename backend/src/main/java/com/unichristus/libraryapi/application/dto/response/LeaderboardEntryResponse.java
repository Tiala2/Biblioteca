package com.unichristus.libraryapi.application.dto.response;

import java.util.UUID;

public record LeaderboardEntryResponse(UUID userId, String name, Long value, String metric) {
}
