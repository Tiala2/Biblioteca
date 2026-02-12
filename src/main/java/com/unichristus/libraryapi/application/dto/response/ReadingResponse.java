package com.unichristus.libraryapi.application.dto.response;

import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingResponse {
    private UUID id;
    private BookResponse book;
    private ReadingStatus status;
    private Integer currentPage;
    private Integer progress;
    private LocalDateTime startedAt;
    private LocalDateTime lastReadedAt;
    private LocalDateTime finishedAt;
}
