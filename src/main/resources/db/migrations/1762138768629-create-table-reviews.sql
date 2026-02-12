--liquibase formatted sql
--changeset iuri:1762138768629

CREATE TABLE reviews
(
    id         UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id    UUID        NOT NULL,
    user_id    UUID        NOT NULL,
    rating     INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
    progress   INTEGER     NOT NULL CHECK (progress >= 0),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_reviews_user_book UNIQUE (user_id, book_id)
);

CREATE OR REPLACE TRIGGER trigger_updated_at
    BEFORE UPDATE
    ON reviews
    FOR EACH ROW
EXECUTE FUNCTION trigger_updated_at();

CREATE INDEX idx_reviews_book_id ON reviews (book_id);
CREATE INDEX idx_reviews_user_id ON reviews (user_id);