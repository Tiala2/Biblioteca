package com.unichristus.libraryapi.application.usecase.reading;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.ReadingResponse;
import com.unichristus.libraryapi.application.mapper.ReadingResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingService;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class ReadingUseCase {

    private final ReadingService readingService;
    private final BookService bookService;

    public ReadingResponse syncReading(UUID userId, UUID bookId, Integer currentPage) {
        Reading reading = findReadingInProgressOrCreateReading(userId, bookId);
        readingService.updateReadingProgress(reading, currentPage);
        return ReadingResponseMapper.toReadingResponse(reading);
    }

    public Reading findReadingInProgressOrCreateReading(UUID userId, UUID bookId) {
        Book book = bookService.findBookByIdOrThrow(bookId);
        return readingService.findReadingInProgressOrCreateReading(userId, book);
    }

}
