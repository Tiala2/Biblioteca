--liquibase formatted sql
--changeset iuri:1760412940331

CREATE TABLE books
(
    id               UUID         NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    isbn             VARCHAR(13)  NOT NULL,
    number_of_pages  INTEGER      NOT NULL CHECK (number_of_pages >= 1),
    publication_date DATE         NOT NULL,
    cover_url        VARCHAR(512),
    has_pdf          BOOLEAN      NOT NULL DEFAULT FALSE,
    available        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_books_isbn UNIQUE (isbn)
);

CREATE OR REPLACE TRIGGER trigger_updated_at
    BEFORE UPDATE
    ON books
    FOR EACH ROW
EXECUTE FUNCTION trigger_updated_at();

-- Índice para buscas por título (com suporte a ILIKE e prefix search)
CREATE INDEX idx_books_title_lower
    ON books (LOWER(title));

-- Índice para buscas por ISBN
CREATE INDEX idx_books_isbn
    ON books (isbn);

-- Índice composto otimizado para buscas frequentes: livros disponíveis com PDF
CREATE INDEX idx_books_available_pdf_true
    ON books (available, has_pdf)
    WHERE available = TRUE AND has_pdf = TRUE;