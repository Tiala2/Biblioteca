package com.unichristus.libraryapi.application.dto.response;

public record ReviewHomeResponse(
        String bookTitle,
        String bookCoverUrl,
        Integer rating
) {
}
