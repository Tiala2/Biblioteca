--liquibase formatted sql
--changeset codex:1764400000001

ALTER TABLE books
    ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'LOCAL'
        CHECK (source IN ('LOCAL', 'OPEN'));

ALTER TABLE books
    ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE books
SET last_seen_at = COALESCE(updated_at, created_at, now())
WHERE last_seen_at IS NULL;

CREATE INDEX idx_books_source_last_seen_at
    ON books (source, last_seen_at);
