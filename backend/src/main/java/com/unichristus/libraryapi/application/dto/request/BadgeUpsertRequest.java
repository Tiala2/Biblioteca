package com.unichristus.libraryapi.application.dto.request;

import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import com.unichristus.libraryapi.domain.engagement.BadgeCriteriaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Value;

@Value
public class BadgeUpsertRequest {
    @NotNull
    BadgeCode code;

    @NotBlank
    @Size(max = 150)
    String name;

    @Size(max = 255)
    String description;

    @NotNull
    BadgeCriteriaType criteriaType;

    @Size(max = 50)
    String criteriaValue;

    @NotNull
    Boolean active;
}
