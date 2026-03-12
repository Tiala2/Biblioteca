--liquibase formatted sql
--changeset copilot:1764000000002 splitStatements:false endDelimiter:$$

INSERT INTO badge_definitions (code, name, description, criteria_type, criteria_value, active)
VALUES
    ('STREAK_30_DAYS', 'Streak de 30 dias', 'Leu por 30 dias consecutivos', 'STREAK_DAYS', '30', TRUE),
    ('TOTAL_BOOKS_10', '10 livros concluídos', 'Concluiu 10 livros na plataforma', 'TOTAL_BOOKS', '10', TRUE),
    ('TOTAL_PAGES_1000', 'Leitor de 1000 páginas', 'Leu pelo menos 1000 páginas registradas', 'TOTAL_PAGES', '1000', TRUE)
ON CONFLICT (code) DO NOTHING;
$$
