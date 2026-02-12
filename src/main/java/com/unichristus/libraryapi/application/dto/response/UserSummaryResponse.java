package com.unichristus.libraryapi.application.dto.response;

public record UserSummaryResponse(
        Integer totalInProgress,
        Integer totalFinished,
        Integer totalPagesRead
) {
}
