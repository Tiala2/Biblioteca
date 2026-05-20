--liquibase formatted sql
--changeset codex:1765700000001

UPDATE books
SET author = 'Autor não informado'
WHERE author = 'Autor nao informado';

UPDATE books
SET cover_url = NULL
WHERE cover_url ILIKE 'https://images.example.com/%'
   OR cover_url ILIKE 'https://example.com/%'
   OR cover_url ILIKE 'https://exemplo.com/%';

UPDATE collections
SET cover_url = NULL
WHERE cover_url ILIKE 'https://images.example.com/%'
   OR cover_url ILIKE 'https://example.com/%'
   OR cover_url ILIKE 'https://exemplo.com/%';
