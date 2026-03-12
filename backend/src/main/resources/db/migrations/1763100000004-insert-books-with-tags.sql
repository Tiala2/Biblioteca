--liquibase formatted sql
--changeset app:1763100000004

-- Novos livros com capa e PDF disponível
INSERT INTO books (title, isbn, number_of_pages, publication_date, cover_url, has_pdf, available)
VALUES
    ('Deep Learning', '9780262035613', 775, '2016-11-18', 'https://images.example.com/deep-learning.jpg', TRUE, TRUE),
    ('Habitos Atômicos', '9780735211292', 320, '2018-10-16', 'https://images.example.com/atomic-habits.jpg', TRUE, TRUE),
    ('O Hobbit', '9780547928227', 320, '1937-09-21', 'https://images.example.com/hobbit.jpg', TRUE, TRUE),
    ('Duna', '9780441172719', 688, '1965-08-01', 'https://images.example.com/dune.jpg', TRUE, TRUE),
    ('Pai Rico, Pai Pobre', '9788576849949', 336, '1997-04-01', 'https://images.example.com/rich-dad.jpg', TRUE, TRUE),
    ('A Guerra dos Tronos', '9780553103540', 694, '1996-08-06', 'https://images.example.com/got.jpg', TRUE, TRUE);

-- Associações de tags
INSERT INTO book_tags (book_id, tag_id)
SELECT b.id, t.id FROM books b, tags t
WHERE b.isbn = '9780262035613' AND t.name IN ('Tecnologia','IA');

INSERT INTO book_tags (book_id, tag_id)
SELECT b.id, t.id FROM books b, tags t
WHERE b.isbn = '9780735211292' AND t.name IN ('Productividade','Bem-estar');

INSERT INTO book_tags (book_id, tag_id)
SELECT b.id, t.id FROM books b, tags t
WHERE b.isbn = '9780547928227' AND t.name IN ('Fantasia','Clássicos');

INSERT INTO book_tags (book_id, tag_id)
SELECT b.id, t.id FROM books b, tags t
WHERE b.isbn = '9780441172719' AND t.name IN ('Ficção Científica','Clássicos');

INSERT INTO book_tags (book_id, tag_id)
SELECT b.id, t.id FROM books b, tags t
WHERE b.isbn = '9788576849949' AND t.name IN ('Negócios','Productividade');

INSERT INTO book_tags (book_id, tag_id)
SELECT b.id, t.id FROM books b, tags t
WHERE b.isbn = '9780553103540' AND t.name IN ('Fantasia');
