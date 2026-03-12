--liquibase formatted sql
--changeset app:1763100000001

CREATE TABLE tags
(
    id         UUID         NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER trigger_updated_at_tags
    BEFORE UPDATE
    ON tags
    FOR EACH ROW
EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE book_tags
(
    book_id UUID NOT NULL,
    tag_id  UUID NOT NULL,
    PRIMARY KEY (book_id, tag_id),
    CONSTRAINT fk_book_tags_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE INDEX idx_book_tags_book_id ON book_tags (book_id);
CREATE INDEX idx_book_tags_tag_id ON book_tags (tag_id);
