--liquibase formatted sql
--changeset codex:1764500000001

CREATE INDEX IF NOT EXISTS idx_favorites_book_id
    ON favorites (book_id);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_logged_at
    ON reading_sessions (book_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_books_available_publication_date
    ON books (available, publication_date DESC)
    WHERE available = TRUE;
