--liquibase formatted sql
--changeset codex:1764600000001

ALTER TABLE books
    ADD COLUMN author VARCHAR(255);

UPDATE books
SET author = CASE isbn
    WHEN '9780132350884' THEN 'Robert C. Martin'
    WHEN '9780451524935' THEN 'George Orwell'
    WHEN '9788595084865' THEN 'Antoine de Saint-Exupery'
    WHEN '9788583862062' THEN 'Machado de Assis'
    WHEN '9788532530802' THEN 'J. K. Rowling'
    ELSE author
END
WHERE author IS NULL;

UPDATE books
SET author = 'Autor nao informado'
WHERE author IS NULL OR BTRIM(author) = '';

ALTER TABLE books
    ALTER COLUMN author SET NOT NULL;

CREATE INDEX idx_books_author_lower
    ON books (LOWER(author));
