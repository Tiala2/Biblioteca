package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import com.unichristus.libraryapi.domain.engagement.BadgeCriteriaType;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class BadgeDefinitionResponse {
    UUID id;
    BadgeCode code;
    String name;
    String description;
    BadgeCriteriaType criteriaType;
    String criteriaValue;
    Boolean active;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
