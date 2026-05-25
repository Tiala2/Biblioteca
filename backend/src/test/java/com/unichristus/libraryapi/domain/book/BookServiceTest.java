package com.unichristus.libraryapi.domain.book;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Test
    void shouldUpdateSuspiciousOpenLibraryPageCountWhenBookAlreadyExists() {
        BookService service = new BookService(bookRepository);
        Book existing = Book.builder()
                .id(UUID.randomUUID())
                .title("A Game of Thrones")
                .author("George R. R. Martin")
                .isbn("9780000000001")
                .numberOfPages(1)
                .publicationDate(LocalDate.of(1996, 1, 1))
                .source(BookSource.OPEN)
                .categories(Set.of())
                .build();

        when(bookRepository.findByIsbn("9780000000001")).thenReturn(Optional.of(existing));
        when(bookRepository.save(existing)).thenReturn(existing);

        Book updated = service.upsertOpenLibraryBook(
                "A Game of Thrones",
                "George R. R. Martin",
                "9780000000001",
                694,
                LocalDate.of(1996, 1, 1),
                "https://covers.openlibrary.org/b/id/1-L.jpg");

        assertThat(updated.getNumberOfPages()).isEqualTo(694);
        verify(bookRepository).save(existing);
        verify(bookRepository, never()).findOpenLibraryBookByTitle("A Game of Thrones");
    }

    @Test
    void shouldReuseExistingOpenLibraryBookWithSameTitleWhenIsbnChanges() {
        BookService service = new BookService(bookRepository);
        Book existing = Book.builder()
                .id(UUID.randomUUID())
                .title("A Farewell to Arms")
                .author("Ernest Hemingway")
                .isbn("9780000000002")
                .numberOfPages(1)
                .publicationDate(LocalDate.of(1929, 1, 1))
                .source(BookSource.OPEN)
                .categories(Set.of())
                .build();

        when(bookRepository.findByIsbn("9780000000003")).thenReturn(Optional.empty());
        when(bookRepository.findOpenLibraryBookByTitle("A Farewell to Arms")).thenReturn(Optional.of(existing));
        when(bookRepository.save(existing)).thenReturn(existing);

        Book updated = service.upsertOpenLibraryBook(
                "A Farewell to Arms",
                "Ernest Hemingway",
                "9780000000003",
                240,
                LocalDate.of(1929, 1, 1),
                null);

        assertThat(updated.getId()).isEqualTo(existing.getId());
        assertThat(updated.getIsbn()).isEqualTo("9780000000002");
        assertThat(updated.getNumberOfPages()).isEqualTo(240);
        verify(bookRepository).save(existing);
    }
}
