package com.unichristus.libraryapi.application.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class BookListResponse extends BookResponse {
    private Double averageRating;
    private Long totalReviews;
}
