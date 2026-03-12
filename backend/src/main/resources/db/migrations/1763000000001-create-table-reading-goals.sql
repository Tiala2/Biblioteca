--liquibase formatted sql
--changeset copilot:1763000000001 splitStatements:false endDelimiter:$$

CREATE TABLE reading_goals (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID        NOT NULL,
    period           VARCHAR(20) NOT NULL, -- WEEKLY | MONTHLY
    target_pages     INTEGER     NOT NULL CHECK (target_pages >= 0),
    progress_pages   INTEGER     NOT NULL DEFAULT 0 CHECK (progress_pages >= 0),
    start_date       DATE        NOT NULL,
    end_date         DATE        NOT NULL,
    status           VARCHAR(20) NOT NULL, -- ACTIVE | COMPLETED | EXPIRED
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_reading_goals_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_reading_goals_user_period ON reading_goals (user_id, period, start_date DESC);

-- trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION trigger_updated_at_reading_goals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_reading_goals_updated
    BEFORE UPDATE ON reading_goals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at_reading_goals();