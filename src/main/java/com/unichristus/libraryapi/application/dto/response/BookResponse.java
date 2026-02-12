package com.unichristus.libraryapi.application.dto.response;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@SuperBuilder
@Data
public class BookResponse {
    private UUID id;
    private String title;
    private String isbn;
    private Integer numberOfPages;
    private LocalDate publicationDate;
    private List<CategoryLowResponse> categories;
}
