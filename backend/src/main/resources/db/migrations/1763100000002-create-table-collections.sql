--liquibase formatted sql
--changeset app:1763100000002

CREATE TABLE collections
(
    id          UUID         NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    title       VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    cover_url   VARCHAR(512),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER trigger_updated_at_collections
    BEFORE UPDATE
    ON collections
    FOR EACH ROW
EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE collection_books
(
    collection_id UUID NOT NULL,
    book_id       UUID NOT NULL,
    PRIMARY KEY (collection_id, book_id),
    CONSTRAINT fk_collection_books_collection FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_books_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

CREATE INDEX idx_collection_books_collection ON collection_books (collection_id);
CREATE INDEX idx_collection_books_book ON collection_books (book_id);
