--liquibase formatted sql
--changeset codex:1765800000001

ALTER TABLE books
    DROP CONSTRAINT IF EXISTS books_source_check;

ALTER TABLE books
    DROP CONSTRAINT IF EXISTS ck_books_source;

ALTER TABLE books
    ADD CONSTRAINT ck_books_source
        CHECK (source IN ('LOCAL', 'OPEN', 'GUTENBERG'));
