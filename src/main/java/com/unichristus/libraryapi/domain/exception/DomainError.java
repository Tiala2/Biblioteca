package com.unichristus.libraryapi.domain.exception;

import lombok.Getter;

@Getter
public enum DomainError {
    GENERIC_ERROR("GENERIC_ERROR", "Ocorreu um erro, tente novamente mais tarde."),

    // USER ERRORS
    USER_NOT_FOUND("USER_NOT_FOUND", "Usuário não encontrado: %s"),
    USER_NOT_AUTHENTICATED("USER_NOT_AUTHENTICATED", "Usuário não autenticado."),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Já existe um usuário cadastrado com o email: %s"),

    // BOOK ERRORS
    BOOK_NOT_FOUND("BOOK_NOT_FOUND", "Livro não encontrado: %s"),
    ISBN_CONFLICT("ISBN_CONFLICT", "Já existe um livro cadastrado com o ISBN: %s"),
    PDF_ALREADY_EXISTS("PDF_ALREADY_EXISTS", "O livro já possui um arquivo PDF enviado: %s"),
    PDF_SIZE_EXCEEDED("PDF_SIZE_EXCEEDED", "O tamanho do arquivo PDF excede o limite permitido de %s MB"),
    BOOK_PDF_NOT_FOUND("BOOK_PDF_NOT_FOUND", "Arquivo PDF do livro não encontrado: %s"),

    // READING ERRORS
    READING_NOT_FOUND("READING_NOT_FOUND", "Leitura não encontrada: %s"),
    READING_ALREADY_IN_PROGRESS("READING_ALREADY_IN_PROGRESS", "Já existe uma leitura em progresso para o usuário: %s e o livro: %s"),
    READING_IN_PROGRESS_NOT_FOUND("READING_IN_PROGRESS_NOT_FOUND", "Nenhuma leitura em progresso encontrada para o usuário: %s e o livro: %s"),
    READING_ALREADY_FINISHED("READING_ALREADY_FINISHED", "A Leitura já está finalizada e não pode ser atualizada: %s"),
    PAGE_LOWER("PAGE_LOWER", "A página informada é menor que a página atual da leitura."),
    PAGE_EXCEEDED("PAGE_EXCEEDED", "A página informada excede o total de páginas do livro."),
    READING_BELONGS_TO_ANOTHER_USER("READING_BELONGS_TO_ANOTHER_USER", "A leitura %s está associada a outro usuário."),
    PDF_NOT_AVAILABLE("PDF_NOT_AVAILABLE", "O livro não possui um arquivo PDF: %s"),

    // FAVORITE ERRORS
    FAVORITE_ALREADY_EXISTS("FAVORITE_ALREADY_EXISTS", "Já existe um favorito cadastrado para o usuário: %s e o livro: %s"),
    FAVORITE_NOT_FOUND("FAVORITE_NOT_FOUND", "Favorito não encontrado: %s"),

    //REVIEWS ERRORS
    REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", "Avaliação não encontrada: %s"),
    REVIEW_NOT_ALLOWED("REVIEW_NOT_ALLOWED", "Não é possível avaliar o livro."),
    REVIEW_BELONGS_TO_ANOTHER_USER("REVIEW_BELONGS_TO_ANOTHER_USER", "A avaliação pertence a outro usuário."),
    REVIEW_ALREADY_EXISTS("REVIEW_ALREADY_EXISTS", "O usuário já avaliou o livro."),

    //CATEGORY ERRORS
    CATEGORY_NOT_FOUND("CATEGORY_NOT_FOUND", "Categoria não encontrada"),
    CATEGORY_ALREADY_EXISTS("CATEGORY_ALREADY_EXISTS", "Já existe uma categoria cadastrada com o nome: %s"),

    ;

    private final String code;
    private final String description;

    DomainError(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
