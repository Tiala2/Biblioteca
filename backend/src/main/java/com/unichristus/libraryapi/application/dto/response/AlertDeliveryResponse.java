package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.alert.AlertChannel;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlertDeliveryResponse(
        UUID id,
        UUID userId,
        String email,
        AlertType alertType,
        AlertChannel channel,
        AlertDeliveryStatus status,
        String message,
        LocalDateTime createdAt
) {
}
