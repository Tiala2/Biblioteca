package com.unichristus.libraryapi.application.dto.response;

import java.util.List;

public record NarrativeQuizResponse(
        String id,
        String question,
        List<String> options,
        String correctOption,
        String explanation
) {
}

