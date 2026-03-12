--liquibase formatted sql
--changeset iuri:1761049764925

CREATE TABLE readings
(
    id             UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id        UUID        NOT NULL REFERENCES users (id),
    book_id        UUID        NOT NULL REFERENCES books (id),
    status         VARCHAR(20) NOT NULL,
    current_page   INTEGER     NOT NULL CHECK (current_page >= 1),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_readed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Não permitir que um usuário tenha mais de uma leitura ativa por livro
CREATE UNIQUE INDEX uk_readings_user_book_active
    ON readings (user_id, book_id)
    WHERE status = 'IN_PROGRESS';

--Performance indexes
CREATE INDEX idx_readings_user_id
    ON readings (user_id);
CREATE INDEX idx_recent_readings_user
    ON readings (user_id, last_readed_at DESC);
CREATE INDEX idx_readings_book_id
    ON readings (book_id);
CREATE INDEX idx_readings_status
    ON readings (status);
CREATE INDEX idx_readings_user_book_status
    ON readings (user_id, book_id, status);

-- Buscar histórico de um livro
CREATE INDEX idx_readings_book_history
    ON readings (book_id, finished_at DESC)
    WHERE status = 'FINISHED';

-- Create triggers
CREATE OR REPLACE TRIGGER trigger_updated_at
    BEFORE UPDATE
    ON readings
    FOR EACH ROW
EXECUTE FUNCTION trigger_updated_at();