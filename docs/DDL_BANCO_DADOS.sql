-- DDL consolidado do banco PostgreSQL do projeto Library
-- Referencia: migrations Liquibase em backend/src/main/resources/db/migrations
-- Data de consolidacao: 2026-06-23

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(13) NOT NULL,
    number_of_pages INTEGER NOT NULL CHECK (number_of_pages >= 1),
    publication_date DATE NOT NULL,
    cover_url VARCHAR(512),
    has_pdf BOOLEAN NOT NULL DEFAULT FALSE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_books_isbn UNIQUE (isbn),
    CONSTRAINT ck_books_source CHECK (source IN ('LOCAL', 'OPEN', 'GUTENBERG'))
);

CREATE TRIGGER trigger_updated_at_books
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE INDEX idx_books_title_lower ON books (LOWER(title));
CREATE INDEX idx_books_author_lower ON books (LOWER(author));
CREATE INDEX idx_books_isbn ON books (isbn);
CREATE INDEX idx_books_source_last_seen_at ON books (source, last_seen_at);
CREATE INDEX idx_books_available_pdf_true ON books (available, has_pdf)
    WHERE available = TRUE AND has_pdf = TRUE;
CREATE INDEX idx_books_available_publication_date ON books (available, publication_date DESC)
    WHERE available = TRUE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) > 2),
    email VARCHAR(255) NOT NULL UNIQUE CHECK (char_length(trim(email)) > 4),
    password VARCHAR(60) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    leaderboard_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    alerts_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(30) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(120) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE TRIGGER trigger_updated_at_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE book_categories (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
);

CREATE INDEX idx_book_categories_book_id ON book_categories (book_id);
CREATE INDEX idx_book_categories_category_id ON book_categories (category_id);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_tags
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE book_tags (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)
);

CREATE INDEX idx_book_tags_book_id ON book_tags (book_id);
CREATE INDEX idx_book_tags_tag_id ON book_tags (tag_id);

CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    cover_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_collections
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE collection_books (
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, book_id)
);

CREATE INDEX idx_collection_books_collection ON collection_books (collection_id);
CREATE INDEX idx_collection_books_book ON collection_books (book_id);

CREATE TABLE favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, book_id)
);

CREATE INDEX idx_favorites_book_id ON favorites (book_id);

CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    status VARCHAR(20) NOT NULL,
    current_page INTEGER NOT NULL CHECK (current_page >= 1),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_readed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_readings
    BEFORE UPDATE ON readings
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE UNIQUE INDEX uk_readings_user_book_active
    ON readings (user_id, book_id)
    WHERE status = 'IN_PROGRESS';
CREATE INDEX idx_readings_user_id ON readings (user_id);
CREATE INDEX idx_recent_readings_user ON readings (user_id, last_readed_at DESC);
CREATE INDEX idx_readings_book_id ON readings (book_id);
CREATE INDEX idx_readings_status ON readings (status);
CREATE INDEX idx_readings_user_book_status ON readings (user_id, book_id, status);
CREATE INDEX idx_readings_book_history ON readings (book_id, finished_at DESC)
    WHERE status = 'FINISHED';

CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    pages_read INTEGER NOT NULL CHECK (pages_read >= 0),
    duration_minutes INTEGER,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_reading_sessions
    BEFORE UPDATE ON reading_sessions
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE INDEX idx_reading_sessions_user_logged_at ON reading_sessions (user_id, logged_at DESC);
CREATE INDEX idx_reading_sessions_book_logged_at ON reading_sessions (book_id, logged_at DESC);

CREATE TABLE reading_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    period VARCHAR(20) NOT NULL,
    target_pages INTEGER NOT NULL CHECK (target_pages >= 0),
    progress_pages INTEGER NOT NULL DEFAULT 0 CHECK (progress_pages >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_reading_goals
    BEFORE UPDATE ON reading_goals
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE INDEX idx_reading_goals_user_period ON reading_goals (user_id, period, start_date DESC);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    progress INTEGER NOT NULL CHECK (progress >= 0),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_reviews_user_book UNIQUE (user_id, book_id)
);

CREATE TRIGGER trigger_updated_at_reviews
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE INDEX idx_reviews_book_id ON reviews (book_id);
CREATE INDEX idx_reviews_user_id ON reviews (user_id);

CREATE TABLE badge_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    criteria_type VARCHAR(50) NOT NULL,
    criteria_value VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_updated_at_badge_definitions
    BEFORE UPDATE ON badge_definitions
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    badge_id UUID NOT NULL REFERENCES badge_definitions(id),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_event VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_user_badges_user_badge UNIQUE (user_id, badge_id)
);

CREATE TRIGGER trigger_updated_at_user_badges
    BEFORE UPDATE ON user_badges
    FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TABLE alert_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_deliveries_user_created ON alert_deliveries (user_id, created_at DESC);
CREATE INDEX idx_alert_deliveries_created ON alert_deliveries (created_at DESC);

CREATE TABLE book_narrative_beats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    start_page INTEGER NOT NULL CHECK (start_page >= 1),
    end_page INTEGER NOT NULL CHECK (end_page >= start_page),
    phase VARCHAR(20) NOT NULL,
    beat_title VARCHAR(150),
    plot_state VARCHAR(1000) NOT NULL,
    characters_json TEXT NOT NULL DEFAULT '[]',
    quizzes_json TEXT NOT NULL DEFAULT '[]',
    achievement_code VARCHAR(80),
    achievement_title VARCHAR(150),
    achievement_description VARCHAR(255),
    flashcard_symbol VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_book_narrative_start UNIQUE (book_id, start_page)
);

CREATE INDEX idx_book_narrative_beats_book_page
    ON book_narrative_beats (book_id, start_page, end_page);

