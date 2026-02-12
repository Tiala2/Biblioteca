--liquibase formatted sql
--changeset iuri:1762173430119

CREATE TABLE categories
(
    id          UUID         NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trigger_updated_at
    BEFORE UPDATE
    ON categories
    FOR EACH ROW
EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE book_categories
(
    book_id     UUID NOT NULL,
    category_id UUID NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_book_categories_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_categories_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE INDEX idx_book_categories_book_id ON book_categories (book_id);
CREATE INDEX idx_book_categories_category_id ON book_categories (category_id);