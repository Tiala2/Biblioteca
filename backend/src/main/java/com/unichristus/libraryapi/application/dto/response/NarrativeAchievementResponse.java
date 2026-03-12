package com.unichristus.libraryapi.application.dto.response;

public record NarrativeAchievementResponse(
        String code,
        String title,
        String description,
        String flashcardSymbol,
        Integer unlockPage,
        boolean unlocked
) {
}

