package com.unichristus.libraryapi.application.usecase.book;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
final class OpenLibraryBookMetadataSupport {

    private static final int DEFAULT_PAGE_COUNT = 240;
    private static final int MIN_RELIABLE_PAGE_COUNT = 10;
    private static final int MAX_RELIABLE_PAGE_COUNT = 5000;

    static Integer sanitizePages(Integer value) {
        if (value == null || value < MIN_RELIABLE_PAGE_COUNT) {
            return DEFAULT_PAGE_COUNT;
        }
        if (value > MAX_RELIABLE_PAGE_COUNT) {
            return MAX_RELIABLE_PAGE_COUNT;
        }
        return value;
    }

    static LocalDate sanitizePublicationDate(Integer firstPublishYear) {
        if (firstPublishYear == null || firstPublishYear < 1000) {
            return LocalDate.of(1970, 1, 1);
        }

        int currentYear = LocalDate.now().getYear();
        if (firstPublishYear >= currentYear) {
            return LocalDate.now().minusDays(1);
        }

        return LocalDate.of(firstPublishYear, 1, 1);
    }

    static String coverUrlFrom(Integer coverId) {
        return coverId == null ? null : "https://covers.openlibrary.org/b/id/%d-L.jpg".formatted(coverId);
    }
}
