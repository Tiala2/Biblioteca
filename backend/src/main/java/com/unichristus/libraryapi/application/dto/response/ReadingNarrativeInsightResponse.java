package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.narrative.StoryPhase;

import java.util.List;
import java.util.UUID;

public record ReadingNarrativeInsightResponse(
        UUID bookId,
        Integer currentPage,
        StoryPhase phase,
        String beatTitle,
        String plotState,
        List<NarrativeCharacterResponse> knownCharacters,
        List<NarrativeQuizResponse> quizzes,
        List<NarrativeAchievementResponse> achievements
) {
}

