--liquibase formatted sql
--changeset app:1763100000003

INSERT INTO tags (name) VALUES
    ('Tecnologia'),
    ('Clássicos'),
    ('Fantasia'),
    ('Ficção Científica'),
    ('Productividade'),
    ('Negócios'),
    ('Bem-estar'),
    ('IA');
