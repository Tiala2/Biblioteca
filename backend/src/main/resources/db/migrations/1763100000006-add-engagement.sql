-- Add opt-in flag for leaderboard
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Badges earned by users
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_badge_user_code UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
