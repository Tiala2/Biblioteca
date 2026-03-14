package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.book.BookSource;
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
    private String coverUrl;
    private BookSource source;
    private boolean favorite;
}
