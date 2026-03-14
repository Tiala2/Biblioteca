package com.unichristus.libraryapi.application.usecase.book;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
final class OpenLibraryBookMetadataSupport {

    static Integer sanitizePages(Integer value) {
        if (value == null || value < 1) {
            return 1;
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
