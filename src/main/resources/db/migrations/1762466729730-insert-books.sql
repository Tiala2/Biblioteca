--liquibase formatted sql
--changeset author:1762466729730

INSERT INTO books (title, isbn, number_of_pages, publication_date)
VALUES ('Clean Code: A Handbook of Agile Software Craftsmanship', '9780132350884', 464, '2008-08-01'),
       ('1984', '9780451524935', 328, '1949-06-08'),
       ('O Pequeno Príncipe', '9788595084865', 96, '1943-04-06'),
       ('Dom Casmurro', '9788583862062', 256, '1899-01-01'),
       ('Harry Potter e a Pedra Filosofal', '9788532530802', 264, '1997-06-26');