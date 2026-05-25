package com.unichristus.libraryapi.application.usecase.book;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenLibraryBookMetadataSupportTest {

    @Test
    void shouldUseReadableDefaultWhenOpenLibraryDoesNotProvideReliablePageCount() {
        assertThat(OpenLibraryBookMetadataSupport.sanitizePages(null)).isEqualTo(240);
        assertThat(OpenLibraryBookMetadataSupport.sanitizePages(1)).isEqualTo(240);
        assertThat(OpenLibraryBookMetadataSupport.sanitizePages(9)).isEqualTo(240);
    }

    @Test
    void shouldKeepReliablePageCountWithinSafeRange() {
        assertThat(OpenLibraryBookMetadataSupport.sanitizePages(320)).isEqualTo(320);
        assertThat(OpenLibraryBookMetadataSupport.sanitizePages(6000)).isEqualTo(5000);
    }
}
