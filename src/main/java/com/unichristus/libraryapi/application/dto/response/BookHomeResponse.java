package com.unichristus.libraryapi.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookHomeResponse {
    private UUID id;
    private String title;
    private boolean favorite;
}
