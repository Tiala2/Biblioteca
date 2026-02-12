package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.BookHomeResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingHomeResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingResponse;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingService;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ReadingResponseMapper {

    public static ReadingHomeResponse toReadingHomeResponse(Reading reading, boolean favorite) {
        if (reading == null) return null;
        return ReadingHomeResponse.builder()
                .id(reading.getId())
                .book(new BookHomeResponse(reading.getBook().getId(), reading.getBook().getTitle(), favorite))
                .status(reading.getStatus())
                .currentPage(reading.getCurrentPage())
                .progress(ReadingService.calculateProgressPercentage(reading))
                .startedAt(reading.getStartedAt())
                .lastReadedAt(reading.getLastReadedAt())
                .finishedAt(reading.getFinishedAt())
                .build();
    }

    public static ReadingResponse toReadingResponse(Reading reading) {
        if (reading == null) return null;
        return ReadingResponse.builder()
                .id(reading.getId())
                .book(BookResponseMapper.toBookResponse(reading.getBook()))
                .status(reading.getStatus())
                .currentPage(reading.getCurrentPage())
                .progress(ReadingService.calculateProgressPercentage(reading))
                .startedAt(reading.getStartedAt())
                .lastReadedAt(reading.getLastReadedAt())
                .finishedAt(reading.getFinishedAt())
                .build();
    }

}
