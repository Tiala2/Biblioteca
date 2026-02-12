--liquibase formatted sql
--changeset tiala:1760917088900
-- Criação da tabela de favoritos
CREATE TABLE IF NOT EXISTS favorites
(
    user_id    UUID        NOT NULL,
    book_id    UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, book_id),

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_favorites_book
        FOREIGN KEY (book_id)
            REFERENCES books(id)
            ON DELETE CASCADE
);

-- Comentários para documentação
COMMENT ON TABLE favorites IS 'Tabela que armazena os livros favoritos dos usuários';
COMMENT ON COLUMN favorites.user_id IS 'Referência ao usuário que favoritou o livro';
COMMENT ON COLUMN favorites.book_id IS 'Referência ao livro favoritado';
COMMENT ON COLUMN favorites.created_at IS 'Data e hora em que o livro foi adicionado aos favoritos';
