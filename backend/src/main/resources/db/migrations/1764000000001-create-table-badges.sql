--liquibase formatted sql
--changeset copilot:1764000000001 splitStatements:false endDelimiter:$$

-- 1) Criar catálogo de badges
CREATE TABLE badge_definitions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code           VARCHAR(100) NOT NULL UNIQUE,
    name           VARCHAR(150) NOT NULL,
    description    TEXT,
    criteria_type  VARCHAR(50)  NOT NULL,
    criteria_value VARCHAR(50),
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_updated_at_badge_definitions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_badge_definitions_updated
    BEFORE UPDATE ON badge_definitions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at_badge_definitions();

-- 2) Se já existir a tabela antiga de badges (com user_id), renomear para badges_old
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
        EXECUTE 'ALTER TABLE badges RENAME TO badges_old';
    END IF;
END; $$;

-- 3) Criar tabela user_badges (nova estrutura)
CREATE TABLE user_badges (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL,
    badge_id     UUID        NOT NULL,
    awarded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_event VARCHAR(100),
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badge_definitions(id),
    CONSTRAINT uk_user_badges_user_badge UNIQUE (user_id, badge_id)
);

CREATE OR REPLACE FUNCTION trigger_updated_at_user_badges()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_user_badges_updated
    BEFORE UPDATE ON user_badges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at_user_badges();

-- 4) Seeds do catálogo
INSERT INTO badge_definitions (code, name, description, criteria_type, criteria_value)
VALUES
    ('FIRST_BOOK_FINISHED', 'Primeiro livro concluído', 'Concluiu o primeiro livro na plataforma', 'FIRST_BOOK', NULL),
    ('STREAK_7_DAYS', 'Streak de 7 dias', 'Leu por 7 dias consecutivos', 'STREAK_DAYS', '7');

-- 5) Migrar dados antigos, se existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges_old') THEN
        INSERT INTO user_badges (id, user_id, badge_id, awarded_at, source_event, metadata, created_at, updated_at)
        SELECT
            b.id,
            b.user_id,
            bd.id,
            b.earned_at,
            'MIGRATED',
            NULL,
            b.created_at,
            b.created_at
        FROM badges_old b
        JOIN badge_definitions bd ON bd.code = b.code;

        DROP TABLE badges_old;
    END IF;
END; $$;
