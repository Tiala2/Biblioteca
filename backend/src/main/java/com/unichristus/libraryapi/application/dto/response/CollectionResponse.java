package com.unichristus.libraryapi.application.dto.response;

import java.util.List;
import java.util.UUID;

public record CollectionResponse(
        UUID id,
        String title,
        String description,
        String coverUrl,
        List<TagResponse> tags,
        List<BookListResponse> books
) {
}
