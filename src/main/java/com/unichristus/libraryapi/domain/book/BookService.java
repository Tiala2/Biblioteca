package com.unichristus.libraryapi.domain.book;

import com.unichristus.libraryapi.domain.book.exception.BookIsbnConflict;
import com.unichristus.libraryapi.domain.book.exception.BookNotFoundException;
import com.unichristus.libraryapi.domain.category.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public Page<Book> findAllAvailable(Pageable pageable) {
        return bookRepository.findBooksByAvailableTrueAndHasPdfTrue(pageable);
    }

    public Book findBookByIdOrThrow(UUID bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));
    }

    public Book save(Book book) {
        return bookRepository.save(book);
    }

    public Book createBook(String title, String isbn, Integer numberOfPages, LocalDate publicationDate, String coverUrl,
                           Set<Category> categories) {
        validateISBNUnique(isbn);
        Book book = Book.builder()
                .title(title)
                .coverUrl(coverUrl)
                .isbn(isbn)
                .numberOfPages(numberOfPages)
                .publicationDate(publicationDate)
                .available(true)
                .categories(categories)
                .build();
        return save(book);
    }

    public void updateBook(UUID bookId, String title, String isbn, Integer numberOfPages, LocalDate publicationDate, Boolean available, Set<Category> categories) {
        Book book = findBookByIdOrThrow(bookId);
        boolean changed = false;
        if (title != null && !title.equals(book.getTitle())) {
            book.setTitle(title);
            changed = true;
        }
        if (isbn != null && !isbn.equals(book.getIsbn())) {
            validateISBNUnique(isbn);
            book.setIsbn(isbn);
            changed = true;
        }
        if (numberOfPages != null && !numberOfPages.equals(book.getNumberOfPages())) {
            book.setNumberOfPages(numberOfPages);
            changed = true;
        }
        if (publicationDate != null && !publicationDate.equals(book.getPublicationDate())) {
            book.setPublicationDate(publicationDate);
            changed = true;
        }
        if (available != null && !available.equals(book.isAvailable())) {
            book.setAvailable(available);
            changed = true;
        }
        if (categories != null && !categories.equals(book.getCategories())) {
            book.setCategories(categories);
            changed = true;
        }
        if (changed) {
            save(book);
        }
    }

    private void validateISBNUnique(String isbn) {
        if (bookRepository.existsBookByIsbn(isbn)) {
            throw new BookIsbnConflict(isbn);
        }
    }

    public void invalidateBook(Book book) {
        book.setAvailable(false);
        save(book);
    }

    public Page<Book> findBooksByCategory(Category category, Pageable pageable) {
        return bookRepository.findBooksByCategory(category, pageable);
    }
}
