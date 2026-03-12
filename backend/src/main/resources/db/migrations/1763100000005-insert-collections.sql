--liquibase formatted sql
--changeset app:1763100000005

INSERT INTO collections (title, description, cover_url)
VALUES
    ('Comece por Tecnologia', 'Livros base para quem quer mergulhar em IA e computação', 'https://images.example.com/collection-tech.jpg'),
    ('Fantasia para maratonar', 'Clássicos e sagas para imersão total', 'https://images.example.com/collection-fantasy.jpg'),
    ('Foco e produtividade', 'Leituras rápidas para criar bons hábitos', 'https://images.example.com/collection-habits.jpg');

-- Vincular livros às coleções
INSERT INTO collection_books (collection_id, book_id)
SELECT c.id, b.id FROM collections c, books b
WHERE c.title = 'Comece por Tecnologia' AND b.isbn IN ('9780262035613','9780441172719');

INSERT INTO collection_books (collection_id, book_id)
SELECT c.id, b.id FROM collections c, books b
WHERE c.title = 'Fantasia para maratonar' AND b.isbn IN ('9780547928227','9780553103540','9788532530802');

INSERT INTO collection_books (collection_id, book_id)
SELECT c.id, b.id FROM collections c, books b
WHERE c.title = 'Foco e produtividade' AND b.isbn IN ('9780735211292','9788576849949');
