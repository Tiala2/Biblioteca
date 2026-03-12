--liquibase formatted sql
--changeset codex:1764200000001 splitStatements:false endDelimiter:$$

CREATE TABLE IF NOT EXISTS book_narrative_beats (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id                 UUID         NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    start_page              INTEGER      NOT NULL CHECK (start_page >= 1),
    end_page                INTEGER      NOT NULL CHECK (end_page >= start_page),
    phase                   VARCHAR(20)  NOT NULL,
    beat_title              VARCHAR(150),
    plot_state              VARCHAR(1000) NOT NULL,
    characters_json         TEXT         NOT NULL DEFAULT '[]',
    quizzes_json            TEXT         NOT NULL DEFAULT '[]',
    achievement_code        VARCHAR(80),
    achievement_title       VARCHAR(150),
    achievement_description VARCHAR(255),
    flashcard_symbol        VARCHAR(50),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_book_narrative_start UNIQUE (book_id, start_page)
);

CREATE INDEX IF NOT EXISTS idx_book_narrative_beats_book_page
    ON book_narrative_beats (book_id, start_page, end_page);

INSERT INTO book_narrative_beats (
    id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json,
    achievement_code, achievement_title, achievement_description, flashcard_symbol
)
SELECT uuid_generate_v4(), b.id, 1, 110, 'BEGINNING', 'Um convite inesperado',
       'Bilbo deixa o conforto do Condado e aceita uma jornada com riscos reais.',
       '[{"name":"Bilbo Bolseiro","role":"PROTAGONIST","note":"Hobbit que inicia a aventura fora de sua rotina."},{"name":"Gandalf","role":"MENTOR","note":"Mago que conduz o primeiro passo da jornada."}]',
       '[{"id":"hobbit-b1-q1","question":"Quem incentiva Bilbo a sair de casa?","options":["Smaug","Gandalf","Thorin","Elrond"],"correctOption":"Gandalf","explanation":"Gandalf organiza a expedição e convence Bilbo."}]',
       'HOBBIT_PORTA_ABERTA', 'Porta da aventura aberta', 'Aceitou sair do Condado e iniciar a jornada.', 'DOOR'
FROM books b
WHERE b.isbn = '9780547928227'
ON CONFLICT (book_id, start_page) DO NOTHING;

INSERT INTO book_narrative_beats (
    id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json,
    achievement_code, achievement_title, achievement_description, flashcard_symbol
)
SELECT uuid_generate_v4(), b.id, 111, 250, 'MIDDLE', 'Aliancas e perigos',
       'A companhia enfrenta perdas e aprende a cooperar para continuar viva.',
       '[{"name":"Thorin","role":"ALLY","note":"Lider dos anoes com foco em recuperar Erebor."},{"name":"Bardo","role":"ALLY","note":"Figura decisiva para o destino da cidade."}]',
       '[{"id":"hobbit-b2-q1","question":"Qual e o foco principal de Thorin durante a jornada?","options":["Fundar o Condado","Recuperar Erebor","Encontrar o Um Anel","Virar rei de Gondor"],"correctOption":"Recuperar Erebor","explanation":"A motivacao central de Thorin e retomar Erebor."}]',
       NULL, NULL, NULL, NULL
FROM books b
WHERE b.isbn = '9780547928227'
ON CONFLICT (book_id, start_page) DO NOTHING;

INSERT INTO book_narrative_beats (
    id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json,
    achievement_code, achievement_title, achievement_description, flashcard_symbol
)
SELECT uuid_generate_v4(), b.id, 251, 320, 'CLIMAX', 'Conflito final por Erebor',
       'O confronto final redefine liderancas, perdas e o sentido da jornada para Bilbo.',
       '[{"name":"Bilbo Bolseiro","role":"PROTAGONIST","note":"Agora mais maduro, toma decisoes sob pressao."},{"name":"Smaug","role":"ANTAGONIST","note":"A ameaca central ligada ao tesouro de Erebor."}]',
       '[{"id":"hobbit-b3-q1","question":"No final, qual mudanca mais marca Bilbo?","options":["Fica igual ao inicio","Abandona o Condado","Ganha maturidade","Perde a memoria"],"correctOption":"Ganha maturidade","explanation":"A jornada altera sua visao e seu comportamento."}]',
       'HOBBIT_EREBOR_CLIMAX', 'Erebor conquistado', 'Concluiu os principais eventos do climax em Erebor.', 'DRAGON'
FROM books b
WHERE b.isbn = '9780547928227'
ON CONFLICT (book_id, start_page) DO NOTHING;

INSERT INTO book_narrative_beats (
    id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json,
    achievement_code, achievement_title, achievement_description, flashcard_symbol
)
SELECT uuid_generate_v4(), b.id, 1, 220, 'BEGINNING', 'Conflitos politicos emergem',
       'Casas nobres disputam poder enquanto novas ameacas surgem em paralelo.',
       '[{"name":"Eddard Stark","role":"PROTAGONIST","note":"Nobre com forte senso de honra."},{"name":"Daenerys Targaryen","role":"PROTAGONIST","note":"Inicia sua trajetoria fora de Westeros."}]',
       '[{"id":"got-b1-q1","question":"Qual tema domina os primeiros capitulos?","options":["Conflitos politicos","Exploracao espacial","Viagem no tempo","Comedia romantica"],"correctOption":"Conflitos politicos","explanation":"O inicio estabelece disputa por poder entre casas."}]',
       'GOT_TABULEIRO_ABERTO', 'Tabuleiro em movimento', 'Compreendeu os principais conflitos iniciais entre as casas.', 'CROWN'
FROM books b
WHERE b.isbn = '9780553103540'
ON CONFLICT (book_id, start_page) DO NOTHING;

INSERT INTO book_narrative_beats (
    id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json,
    achievement_code, achievement_title, achievement_description, flashcard_symbol
)
SELECT uuid_generate_v4(), b.id, 221, 520, 'MIDDLE', 'Aliancas instaveis',
       'Traicoes e aliancas temporarias alteram o equilibrio entre os protagonistas.',
       '[{"name":"Tyrion Lannister","role":"ALLY","note":"Atua com estrategia e adaptacao."},{"name":"Cersei Lannister","role":"ANTAGONIST","note":"Move poder com calculo politico."}]',
       '[{"id":"got-b2-q1","question":"O que mais marca o meio da narrativa?","options":["Estabilidade absoluta","Aliancas instaveis","Fim da guerra","Ausencia de conflito"],"correctOption":"Aliancas instaveis","explanation":"As relacoes mudam constantemente no meio do livro."}]',
       NULL, NULL, NULL, NULL
FROM books b
WHERE b.isbn = '9780553103540'
ON CONFLICT (book_id, start_page) DO NOTHING;

INSERT INTO book_narrative_beats (
    id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json,
    achievement_code, achievement_title, achievement_description, flashcard_symbol
)
SELECT uuid_generate_v4(), b.id, 521, 694, 'CLIMAX', 'Virada de destino',
       'As escolhas finais redefinem o rumo das casas e o futuro do reino.',
       '[{"name":"Jon Snow","role":"ALLY","note":"Enfrenta dilemas de dever e identidade."},{"name":"Daenerys Targaryen","role":"PROTAGONIST","note":"Consolida poder para etapas futuras."}]',
       '[{"id":"got-b3-q1","question":"No clímax, o principal efeito e:","options":["Nada muda","Rumo das casas se redefine","Todos fazem as pazes","A trama recomeça"],"correctOption":"Rumo das casas se redefine","explanation":"O final altera o equilibrio politico e prepara continuacao."}]',
       'GOT_DESTINO_SELADO', 'Destino selado', 'Chegou ao climax e concluiu os principais arcos da obra.', 'WOLF'
FROM books b
WHERE b.isbn = '9780553103540'
ON CONFLICT (book_id, start_page) DO NOTHING;
$$
