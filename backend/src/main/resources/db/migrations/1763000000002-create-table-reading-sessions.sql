--liquibase formatted sql
--changeset copilot:1763000000002 splitStatements:false endDelimiter:$$

CREATE TABLE reading_sessions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID        NOT NULL,
    book_id          UUID        NOT NULL,
    pages_read       INTEGER     NOT NULL CHECK (pages_read >= 0),
    duration_minutes INTEGER,
    logged_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_reading_sessions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reading_sessions_book FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE INDEX idx_reading_sessions_user_logged_at ON reading_sessions (user_id, logged_at DESC);

-- trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION trigger_updated_at_reading_sessions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_reading_sessions_updated
    BEFORE UPDATE ON reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at_reading_sessions();