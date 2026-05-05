package com.unichristus.libraryapi.application.dto.response;

import java.util.UUID;

public record ExternalReaderResponse(
        UUID bookId,
        String source,
        boolean availableInsideApp,
        String embedUrl,
        String fallbackUrl,
        String message
) {
}
