package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class BadgeResponse {
    UUID id;
    BadgeCode code;
    String name;
    String description;
    LocalDateTime awardedAt;
}
