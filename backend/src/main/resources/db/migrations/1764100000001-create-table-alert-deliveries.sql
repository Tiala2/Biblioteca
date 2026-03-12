--liquibase formatted sql
--changeset app:1764100000001

CREATE TABLE alert_deliveries
(
    id          UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     UUID        NOT NULL,
    email       VARCHAR(255) NOT NULL,
    alert_type  VARCHAR(50) NOT NULL,
    channel     VARCHAR(20) NOT NULL,
    status      VARCHAR(30) NOT NULL,
    message     VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_alert_deliveries_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_alert_deliveries_user_created ON alert_deliveries (user_id, created_at DESC);
CREATE INDEX idx_alert_deliveries_created ON alert_deliveries (created_at DESC);
