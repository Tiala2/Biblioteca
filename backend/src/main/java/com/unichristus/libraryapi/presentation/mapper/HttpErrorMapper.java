package com.unichristus.libraryapi.presentation.mapper;

import com.unichristus.libraryapi.domain.exception.DomainError;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@NoArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public final class HttpErrorMapper {

    public static HttpStatus map(DomainError error) {
        return switch (error) {
            case USER_NOT_FOUND, BOOK_NOT_FOUND, READING_NOT_FOUND, FAVORITE_NOT_FOUND, REVIEW_NOT_FOUND,
                 CATEGORY_NOT_FOUND, COLLECTION_NOT_FOUND, TAG_NOT_FOUND, BOOK_PDF_NOT_FOUND, PDF_NOT_AVAILABLE ->
                    HttpStatus.NOT_FOUND;
            case EMAIL_ALREADY_EXISTS, ISBN_CONFLICT, FAVORITE_ALREADY_EXISTS, REVIEW_ALREADY_EXISTS,
                 CATEGORY_ALREADY_EXISTS, TAG_ALREADY_EXISTS ->
                    HttpStatus.CONFLICT;
            case READING_BELONGS_TO_ANOTHER_USER, REVIEW_BELONGS_TO_ANOTHER_USER -> HttpStatus.FORBIDDEN;
            case USER_NOT_AUTHENTICATED -> HttpStatus.UNAUTHORIZED;
            default -> HttpStatus.BAD_REQUEST;
        };
    }
}
