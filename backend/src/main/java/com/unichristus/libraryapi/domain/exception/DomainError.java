package com.unichristus.libraryapi.domain.exception;

import lombok.Getter;

@Getter
public enum DomainError {
    GENERIC_ERROR("GENERIC_ERROR", "Ocorreu um erro, tente novamente mais tarde."),

    // USER ERRORS
    USER_NOT_FOUND("USER_NOT_FOUND", "Usuario nao encontrado: %s"),
    USER_NOT_AUTHENTICATED("USER_NOT_AUTHENTICATED", "Usuario nao autenticado."),
    USER_ROLE_SELF_CHANGE_FORBIDDEN("USER_ROLE_SELF_CHANGE_FORBIDDEN", "Nao e permitido rebaixar o proprio acesso administrativo."),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Ja existe um usuario cadastrado com o email: %s"),
    PASSWORD_RESET_TOKEN_INVALID("PASSWORD_RESET_TOKEN_INVALID", "Token de recuperacao de senha invalido ou expirado."),

    // BOOK ERRORS
    BOOK_NOT_FOUND("BOOK_NOT_FOUND", "Livro nao encontrado: %s"),
    ISBN_CONFLICT("ISBN_CONFLICT", "Ja existe um livro cadastrado com o ISBN: %s"),
    PDF_ALREADY_EXISTS("PDF_ALREADY_EXISTS", "O livro ja possui um arquivo PDF enviado: %s"),
    PDF_SIZE_EXCEEDED("PDF_SIZE_EXCEEDED", "O tamanho do arquivo PDF excede o limite permitido de %s MB"),
    BOOK_PDF_NOT_FOUND("BOOK_PDF_NOT_FOUND", "Arquivo PDF do livro nao encontrado: %s"),

    // READING ERRORS
    READING_NOT_FOUND("READING_NOT_FOUND", "Leitura nao encontrada: %s"),
    READING_ALREADY_IN_PROGRESS("READING_ALREADY_IN_PROGRESS", "Ja existe uma leitura em progresso para o usuario: %s e o livro: %s"),
    READING_IN_PROGRESS_NOT_FOUND("READING_IN_PROGRESS_NOT_FOUND", "Nenhuma leitura em progresso encontrada para o usuario: %s e o livro: %s"),
    READING_ALREADY_FINISHED("READING_ALREADY_FINISHED", "A leitura ja esta finalizada e nao pode ser atualizada: %s"),
    PAGE_LOWER("PAGE_LOWER", "A pagina informada e menor que a pagina atual da leitura."),
    PAGE_EXCEEDED("PAGE_EXCEEDED", "A pagina informada excede o total de paginas do livro."),
    READING_BELONGS_TO_ANOTHER_USER("READING_BELONGS_TO_ANOTHER_USER", "A leitura %s esta associada a outro usuario."),
    PDF_NOT_AVAILABLE("PDF_NOT_AVAILABLE", "O livro nao possui um arquivo PDF: %s"),

    // FAVORITE ERRORS
    FAVORITE_ALREADY_EXISTS("FAVORITE_ALREADY_EXISTS", "Ja existe um favorito cadastrado para o usuario: %s e o livro: %s"),
    FAVORITE_NOT_FOUND("FAVORITE_NOT_FOUND", "Favorito nao encontrado: %s"),

    // REVIEWS ERRORS
    REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", "Avaliacao nao encontrada: %s"),
    REVIEW_NOT_ALLOWED("REVIEW_NOT_ALLOWED", "Nao e possivel avaliar o livro."),
    REVIEW_BELONGS_TO_ANOTHER_USER("REVIEW_BELONGS_TO_ANOTHER_USER", "A avaliacao pertence a outro usuario."),
    REVIEW_ALREADY_EXISTS("REVIEW_ALREADY_EXISTS", "O usuario ja avaliou o livro."),

    // CATEGORY ERRORS
    CATEGORY_NOT_FOUND("CATEGORY_NOT_FOUND", "Categoria nao encontrada"),
    CATEGORY_ALREADY_EXISTS("CATEGORY_ALREADY_EXISTS", "Ja existe uma categoria cadastrada com o nome: %s"),

    // TAG ERRORS
    TAG_NOT_FOUND("TAG_NOT_FOUND", "Tag nao encontrada: %s"),
    TAG_ALREADY_EXISTS("TAG_ALREADY_EXISTS", "Ja existe uma tag cadastrada com o nome: %s"),

    // SEARCH ERRORS
    SEARCH_FILTER_INVALID("SEARCH_FILTER_INVALID", "Parametros de busca invalidos: %s"),

    // COLLECTION ERRORS
    COLLECTION_NOT_FOUND("COLLECTION_NOT_FOUND", "Colecao nao encontrada: %s");

    private final String code;
    private final String description;

    DomainError(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
