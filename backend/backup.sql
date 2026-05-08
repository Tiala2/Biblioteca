--
-- PostgreSQL database dump
--

\restrict JEHdJuD7b6jUFCOFY56MPJhgfcgfYLNjYiDDuEOJ6nd7TytwXogug9WcKtFPZ26

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: trigger_updated_at(); Type: FUNCTION; Schema: public; Owner: library
--

CREATE FUNCTION public.trigger_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_updated_at() OWNER TO library;

--
-- Name: FUNCTION trigger_updated_at(); Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON FUNCTION public.trigger_updated_at() IS 'Trigger function to update the updated_at timestamp on row update';


--
-- Name: trigger_updated_at_badge_definitions(); Type: FUNCTION; Schema: public; Owner: library
--

CREATE FUNCTION public.trigger_updated_at_badge_definitions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_updated_at_badge_definitions() OWNER TO library;

--
-- Name: trigger_updated_at_reading_goals(); Type: FUNCTION; Schema: public; Owner: library
--

CREATE FUNCTION public.trigger_updated_at_reading_goals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_updated_at_reading_goals() OWNER TO library;

--
-- Name: trigger_updated_at_reading_sessions(); Type: FUNCTION; Schema: public; Owner: library
--

CREATE FUNCTION public.trigger_updated_at_reading_sessions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_updated_at_reading_sessions() OWNER TO library;

--
-- Name: trigger_updated_at_user_badges(); Type: FUNCTION; Schema: public; Owner: library
--

CREATE FUNCTION public.trigger_updated_at_user_badges() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_updated_at_user_badges() OWNER TO library;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alert_deliveries; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.alert_deliveries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    alert_type character varying(50) NOT NULL,
    channel character varying(20) NOT NULL,
    status character varying(30) NOT NULL,
    message character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alert_deliveries OWNER TO library;

--
-- Name: badge_definitions; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.badge_definitions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    criteria_type character varying(50) NOT NULL,
    criteria_value character varying(50),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.badge_definitions OWNER TO library;

--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.book_categories (
    book_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.book_categories OWNER TO library;

--
-- Name: book_narrative_beats; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.book_narrative_beats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    book_id uuid NOT NULL,
    start_page integer NOT NULL,
    end_page integer NOT NULL,
    phase character varying(20) NOT NULL,
    beat_title character varying(150),
    plot_state character varying(1000) NOT NULL,
    characters_json text DEFAULT '[]'::text NOT NULL,
    quizzes_json text DEFAULT '[]'::text NOT NULL,
    achievement_code character varying(80),
    achievement_title character varying(150),
    achievement_description character varying(255),
    flashcard_symbol character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT book_narrative_beats_check CHECK ((end_page >= start_page)),
    CONSTRAINT book_narrative_beats_start_page_check CHECK ((start_page >= 1))
);


ALTER TABLE public.book_narrative_beats OWNER TO library;

--
-- Name: book_tags; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.book_tags (
    book_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


ALTER TABLE public.book_tags OWNER TO library;

--
-- Name: books; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.books (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    isbn character varying(13) NOT NULL,
    number_of_pages integer NOT NULL,
    publication_date date NOT NULL,
    cover_url character varying(512),
    has_pdf boolean DEFAULT false NOT NULL,
    available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source character varying(20) DEFAULT 'LOCAL'::character varying NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    author character varying(255) NOT NULL,
    CONSTRAINT books_number_of_pages_check CHECK ((number_of_pages >= 1)),
    CONSTRAINT books_source_check CHECK (((source)::text = ANY ((ARRAY['LOCAL'::character varying, 'OPEN'::character varying])::text[])))
);


ALTER TABLE public.books OWNER TO library;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO library;

--
-- Name: collection_books; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.collection_books (
    collection_id uuid NOT NULL,
    book_id uuid NOT NULL
);


ALTER TABLE public.collection_books OWNER TO library;

--
-- Name: collections; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.collections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(120) NOT NULL,
    description character varying(500),
    cover_url character varying(512),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.collections OWNER TO library;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE public.databasechangelog OWNER TO library;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE public.databasechangeloglock OWNER TO library;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.favorites (
    user_id uuid NOT NULL,
    book_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorites OWNER TO library;

--
-- Name: TABLE favorites; Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON TABLE public.favorites IS 'Tabela que armazena os livros favoritos dos usuários';


--
-- Name: COLUMN favorites.user_id; Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON COLUMN public.favorites.user_id IS 'Referência ao usuário que favoritou o livro';


--
-- Name: COLUMN favorites.book_id; Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON COLUMN public.favorites.book_id IS 'Referência ao livro favoritado';


--
-- Name: COLUMN favorites.created_at; Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON COLUMN public.favorites.created_at IS 'Data e hora em que o livro foi adicionado aos favoritos';


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(120) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO library;

--
-- Name: reading_goals; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.reading_goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    period character varying(20) NOT NULL,
    target_pages integer NOT NULL,
    progress_pages integer DEFAULT 0 NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reading_goals_progress_pages_check CHECK ((progress_pages >= 0)),
    CONSTRAINT reading_goals_target_pages_check CHECK ((target_pages >= 0))
);


ALTER TABLE public.reading_goals OWNER TO library;

--
-- Name: reading_sessions; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.reading_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    book_id uuid NOT NULL,
    pages_read integer NOT NULL,
    duration_minutes integer,
    logged_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reading_sessions_pages_read_check CHECK ((pages_read >= 0))
);


ALTER TABLE public.reading_sessions OWNER TO library;

--
-- Name: readings; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.readings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    book_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    current_page integer NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_readed_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT readings_current_page_check CHECK ((current_page >= 1))
);


ALTER TABLE public.readings OWNER TO library;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    book_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    progress integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_progress_check CHECK ((progress >= 0)),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO library;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tags OWNER TO library;

--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    awarded_at timestamp with time zone DEFAULT now() NOT NULL,
    source_event character varying(100),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_badges OWNER TO library;

--
-- Name: users; Type: TABLE; Schema: public; Owner: library
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(60) NOT NULL,
    active boolean DEFAULT true,
    role character varying(30) DEFAULT 'USER'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    leaderboard_opt_in boolean DEFAULT false NOT NULL,
    alerts_opt_in boolean DEFAULT true NOT NULL,
    CONSTRAINT users_email_check CHECK ((char_length(TRIM(BOTH FROM email)) > 4)),
    CONSTRAINT users_name_check CHECK ((char_length(TRIM(BOTH FROM name)) > 2)),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO library;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON TABLE public.users IS 'System users table';


--
-- Name: COLUMN users.password; Type: COMMENT; Schema: public; Owner: library
--

COMMENT ON COLUMN public.users.password IS 'Password should be stored using secure hash (e.g., BCrypt)';


--
-- Data for Name: alert_deliveries; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.alert_deliveries (id, user_id, email, alert_type, channel, status, message, created_at) FROM stdin;
\.


--
-- Data for Name: badge_definitions; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.badge_definitions (id, code, name, description, criteria_type, criteria_value, active, created_at, updated_at) FROM stdin;
4f516761-fb96-481c-a002-7e7897ed7e6f	FIRST_BOOK_FINISHED	Primeiro livro concluído	Concluiu o primeiro livro na plataforma	FIRST_BOOK	\N	t	2026-04-30 20:28:01.637541+00	2026-04-30 20:28:01.637541+00
b5664ca2-1a42-439c-8e06-bd66f5d09627	STREAK_7_DAYS	Streak de 7 dias	Leu por 7 dias consecutivos	STREAK_DAYS	7	t	2026-04-30 20:28:01.637541+00	2026-04-30 20:28:01.637541+00
4cc0797d-773e-4bab-b05f-dbe971a72652	STREAK_30_DAYS	Streak de 30 dias	Leu por 30 dias consecutivos	STREAK_DAYS	30	t	2026-04-30 20:28:01.770482+00	2026-04-30 20:28:01.770482+00
9e9cb595-5f4d-4355-b3a0-5a64cba77424	TOTAL_BOOKS_10	10 livros concluídos	Concluiu 10 livros na plataforma	TOTAL_BOOKS	10	t	2026-04-30 20:28:01.770482+00	2026-04-30 20:28:01.770482+00
247868ab-566c-4f0e-a88f-f047c8682306	TOTAL_PAGES_1000	Leitor de 1000 páginas	Leu pelo menos 1000 páginas registradas	TOTAL_PAGES	1000	t	2026-04-30 20:28:01.770482+00	2026-04-30 20:28:01.770482+00
\.


--
-- Data for Name: book_categories; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.book_categories (book_id, category_id) FROM stdin;
\.


--
-- Data for Name: book_narrative_beats; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.book_narrative_beats (id, book_id, start_page, end_page, phase, beat_title, plot_state, characters_json, quizzes_json, achievement_code, achievement_title, achievement_description, flashcard_symbol, created_at) FROM stdin;
2d8f8319-1bea-4cb2-99a1-2a90f1940028	f03f89a0-8801-40a1-b5ca-bb579f97c5b7	1	110	BEGINNING	Um convite inesperado	Bilbo deixa o conforto do Condado e aceita uma jornada com riscos reais.	[{"name":"Bilbo Bolseiro","role":"PROTAGONIST","note":"Hobbit que inicia a aventura fora de sua rotina."},{"name":"Gandalf","role":"MENTOR","note":"Mago que conduz o primeiro passo da jornada."}]	[{"id":"hobbit-b1-q1","question":"Quem incentiva Bilbo a sair de casa?","options":["Smaug","Gandalf","Thorin","Elrond"],"correctOption":"Gandalf","explanation":"Gandalf organiza a expedição e convence Bilbo."}]	HOBBIT_PORTA_ABERTA	Porta da aventura aberta	Aceitou sair do Condado e iniciar a jornada.	DOOR	2026-04-30 20:28:01.864593+00
35629c8b-d0de-4ef9-862a-65b4a7608567	f03f89a0-8801-40a1-b5ca-bb579f97c5b7	111	250	MIDDLE	Aliancas e perigos	A companhia enfrenta perdas e aprende a cooperar para continuar viva.	[{"name":"Thorin","role":"ALLY","note":"Lider dos anoes com foco em recuperar Erebor."},{"name":"Bardo","role":"ALLY","note":"Figura decisiva para o destino da cidade."}]	[{"id":"hobbit-b2-q1","question":"Qual e o foco principal de Thorin durante a jornada?","options":["Fundar o Condado","Recuperar Erebor","Encontrar o Um Anel","Virar rei de Gondor"],"correctOption":"Recuperar Erebor","explanation":"A motivacao central de Thorin e retomar Erebor."}]	\N	\N	\N	\N	2026-04-30 20:28:01.864593+00
bcc5c71d-99da-4f4c-8890-721c426349f0	f03f89a0-8801-40a1-b5ca-bb579f97c5b7	251	320	CLIMAX	Conflito final por Erebor	O confronto final redefine liderancas, perdas e o sentido da jornada para Bilbo.	[{"name":"Bilbo Bolseiro","role":"PROTAGONIST","note":"Agora mais maduro, toma decisoes sob pressao."},{"name":"Smaug","role":"ANTAGONIST","note":"A ameaca central ligada ao tesouro de Erebor."}]	[{"id":"hobbit-b3-q1","question":"No final, qual mudanca mais marca Bilbo?","options":["Fica igual ao inicio","Abandona o Condado","Ganha maturidade","Perde a memoria"],"correctOption":"Ganha maturidade","explanation":"A jornada altera sua visao e seu comportamento."}]	HOBBIT_EREBOR_CLIMAX	Erebor conquistado	Concluiu os principais eventos do climax em Erebor.	DRAGON	2026-04-30 20:28:01.864593+00
e1e6cd03-2841-4e97-b711-9ba6bc261657	decec4ec-e99f-4ffe-b026-a7debaddbcc0	1	220	BEGINNING	Conflitos politicos emergem	Casas nobres disputam poder enquanto novas ameacas surgem em paralelo.	[{"name":"Eddard Stark","role":"PROTAGONIST","note":"Nobre com forte senso de honra."},{"name":"Daenerys Targaryen","role":"PROTAGONIST","note":"Inicia sua trajetoria fora de Westeros."}]	[{"id":"got-b1-q1","question":"Qual tema domina os primeiros capitulos?","options":["Conflitos politicos","Exploracao espacial","Viagem no tempo","Comedia romantica"],"correctOption":"Conflitos politicos","explanation":"O inicio estabelece disputa por poder entre casas."}]	GOT_TABULEIRO_ABERTO	Tabuleiro em movimento	Compreendeu os principais conflitos iniciais entre as casas.	CROWN	2026-04-30 20:28:01.864593+00
67543455-5fcf-4ddc-93e3-054e92774171	decec4ec-e99f-4ffe-b026-a7debaddbcc0	221	520	MIDDLE	Aliancas instaveis	Traicoes e aliancas temporarias alteram o equilibrio entre os protagonistas.	[{"name":"Tyrion Lannister","role":"ALLY","note":"Atua com estrategia e adaptacao."},{"name":"Cersei Lannister","role":"ANTAGONIST","note":"Move poder com calculo politico."}]	[{"id":"got-b2-q1","question":"O que mais marca o meio da narrativa?","options":["Estabilidade absoluta","Aliancas instaveis","Fim da guerra","Ausencia de conflito"],"correctOption":"Aliancas instaveis","explanation":"As relacoes mudam constantemente no meio do livro."}]	\N	\N	\N	\N	2026-04-30 20:28:01.864593+00
edf9f702-c931-430b-8b1b-b5f4457d08d9	decec4ec-e99f-4ffe-b026-a7debaddbcc0	521	694	CLIMAX	Virada de destino	As escolhas finais redefinem o rumo das casas e o futuro do reino.	[{"name":"Jon Snow","role":"ALLY","note":"Enfrenta dilemas de dever e identidade."},{"name":"Daenerys Targaryen","role":"PROTAGONIST","note":"Consolida poder para etapas futuras."}]	[{"id":"got-b3-q1","question":"No clímax, o principal efeito e:","options":["Nada muda","Rumo das casas se redefine","Todos fazem as pazes","A trama recomeça"],"correctOption":"Rumo das casas se redefine","explanation":"O final altera o equilibrio politico e prepara continuacao."}]	GOT_DESTINO_SELADO	Destino selado	Chegou ao climax e concluiu os principais arcos da obra.	WOLF	2026-04-30 20:28:01.864593+00
\.


--
-- Data for Name: book_tags; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.book_tags (book_id, tag_id) FROM stdin;
5302b656-5d81-4c93-8c54-4c86780f1660	b55e802f-da93-4b7d-b912-fb2770021bb7
5302b656-5d81-4c93-8c54-4c86780f1660	7c52795e-6ab7-4748-b1b6-0029753e730a
54d30285-4dcf-496d-9d33-c53f7478a345	07cf2c5c-201e-44b1-a1ad-1ed3c428dd28
54d30285-4dcf-496d-9d33-c53f7478a345	d2e817ce-cf1a-40a4-8bc7-101856a0bdbc
f03f89a0-8801-40a1-b5ca-bb579f97c5b7	619c5713-524e-4ee6-b829-e934923f662e
f03f89a0-8801-40a1-b5ca-bb579f97c5b7	257adf5d-41eb-4eed-a34c-7a2370434fb7
b8c8eca8-bed6-4d77-8ee8-6ce81ee0e2c8	619c5713-524e-4ee6-b829-e934923f662e
b8c8eca8-bed6-4d77-8ee8-6ce81ee0e2c8	3e85ce2b-9919-42d9-8886-951c926db48c
b6e438d1-88ee-4b6b-ac9a-e9a1dc0f31be	07cf2c5c-201e-44b1-a1ad-1ed3c428dd28
b6e438d1-88ee-4b6b-ac9a-e9a1dc0f31be	4eeebfb3-caca-4086-9179-6af78bda6a54
decec4ec-e99f-4ffe-b026-a7debaddbcc0	257adf5d-41eb-4eed-a34c-7a2370434fb7
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.books (id, title, isbn, number_of_pages, publication_date, cover_url, has_pdf, available, created_at, updated_at, source, last_seen_at, author) FROM stdin;
04c9984e-7d04-4798-be6a-f6d8f7692f3f	Clean Code: A Handbook of Agile Software Craftsmanship	9780132350884	464	2008-08-01	\N	f	t	2026-04-30 20:28:00.649962+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Robert C. Martin
0db37c57-3edc-492d-9269-4211c106508b	1984	9780451524935	328	1949-06-08	\N	f	t	2026-04-30 20:28:00.649962+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	George Orwell
37340d80-c5ef-47cb-afae-f930a99bfda6	O Pequeno Príncipe	9788595084865	96	1943-04-06	\N	f	t	2026-04-30 20:28:00.649962+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Antoine de Saint-Exupery
f361c3e1-b74c-421a-b608-d87699c0ff60	Dom Casmurro	9788583862062	256	1899-01-01	\N	f	t	2026-04-30 20:28:00.649962+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Machado de Assis
9c8210dc-068e-4a59-9671-f45a83026e29	Harry Potter e a Pedra Filosofal	9788532530802	264	1997-06-26	\N	f	t	2026-04-30 20:28:00.649962+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	J. K. Rowling
5302b656-5d81-4c93-8c54-4c86780f1660	Deep Learning	9780262035613	775	2016-11-18	https://images.example.com/deep-learning.jpg	t	t	2026-04-30 20:28:01.457341+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Autor nao informado
54d30285-4dcf-496d-9d33-c53f7478a345	Habitos Atômicos	9780735211292	320	2018-10-16	https://images.example.com/atomic-habits.jpg	t	t	2026-04-30 20:28:01.457341+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Autor nao informado
f03f89a0-8801-40a1-b5ca-bb579f97c5b7	O Hobbit	9780547928227	320	1937-09-21	https://images.example.com/hobbit.jpg	t	t	2026-04-30 20:28:01.457341+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Autor nao informado
b8c8eca8-bed6-4d77-8ee8-6ce81ee0e2c8	Duna	9780441172719	688	1965-08-01	https://images.example.com/dune.jpg	t	t	2026-04-30 20:28:01.457341+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Autor nao informado
b6e438d1-88ee-4b6b-ac9a-e9a1dc0f31be	Pai Rico, Pai Pobre	9788576849949	336	1997-04-01	https://images.example.com/rich-dad.jpg	t	t	2026-04-30 20:28:01.457341+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Autor nao informado
decec4ec-e99f-4ffe-b026-a7debaddbcc0	A Guerra dos Tronos	9780553103540	694	1996-08-06	https://images.example.com/got.jpg	t	t	2026-04-30 20:28:01.457341+00	2026-04-30 20:28:02.043312+00	LOCAL	2026-04-30 20:28:01.97024+00	Autor nao informado
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.categories (id, name, description, active, created_at, updated_at) FROM stdin;
a1dd014b-fb34-4ef5-944f-d7d6a929ea9f	Ficção Científica	Livros de ficção científica, futurismo e tecnologia	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
146da07d-1424-4421-88af-4892a5b7f44b	Romance	Histórias de amor, relacionamentos e drama romântico	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
098712e3-6f3e-4d4c-9a4f-87062b378387	Fantasia	Mundos mágicos, criaturas fantásticas e aventuras épicas	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
8b67b706-1b30-4af0-80f9-a8c8f7e1f249	Suspense e Mistério	Thrillers, mistérios e histórias de investigação	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
61659c95-1266-45ab-b571-f27a7cadc751	Terror	Histórias de horror, suspense psicológico e sobrenatural	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
abf76160-4fd5-4d2b-ae87-d6f14eef1c4b	Biografia e Autobiografia	Histórias reais de vidas notáveis e memórias pessoais	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
c746311e-5ae0-43b1-ba1d-ac769485728b	Autoajuda	Desenvolvimento pessoal, motivação e crescimento	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
7fe0718f-9639-47ed-a5ab-3f61fe5d3df2	Negócios e Economia	Gestão, empreendedorismo, finanças e economia	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
f173aaf9-4d5c-43ec-8862-1962c951ba25	Tecnologia e Computação	Programação, inteligência artificial, ciência da computação	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
910c3e58-4c44-42f1-8c89-492c83da1b9a	História	Eventos históricos, civilizações antigas e análise histórica	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
f2727853-aadc-47d4-ae8c-5e45d35fefb0	Filosofia	Pensamento filosófico, ética e reflexões existenciais	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
496f23e2-2a27-4f71-99db-e30d9a39819f	Ciências	Biologia, física, química e ciências naturais	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
9d97f4a5-ef43-4eca-b6b2-6059b40e790b	Psicologia	Comportamento humano, mente e processos mentais	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
f0122bb4-2fa5-4818-b566-395e5fb0072e	Saúde e Bem-estar	Medicina, nutrição, fitness e qualidade de vida	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
c22f0afd-5f15-4e22-a12f-37674eca57a7	Culinária	Receitas, gastronomia e técnicas culinárias	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
8467ad7b-2d90-4879-b0ac-3471a91d261e	Arte e Fotografia	Técnicas artísticas, história da arte e fotografia	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
ec8c8bde-a8bc-41a6-803b-5fccd15ce890	Poesia	Versos, poemas e literatura poética	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
0b311118-2050-44f2-b54c-7cb312b6c32e	Literatura Clássica	Grandes obras da literatura mundial	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
de2e540a-b92a-4c0c-bf50-0aed46930632	Literatura Brasileira	Obras de autores brasileiros e cultura nacional	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
ecdffcea-93a4-4b52-adc9-5a53503ea3c7	Educação	Pedagogia, didática e métodos de ensino	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
eefbf496-4d97-478e-b007-db48798c0f09	Direito	Legislação, jurisprudência e ciências jurídicas	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
b560d7a5-92c0-47d6-b6c6-f8f1045629d7	Religião e Espiritualidade	Textos religiosos, espiritualidade e fé	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
824e43a6-d516-4bf3-b3f0-1e4e1225044d	Política	Teoria política, sistemas de governo e análise política	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
45194f57-8224-4dd0-bf63-d95c6c103036	Viagens	Guias de viagem, relatos e cultura de diferentes países	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
dca303ec-5079-44ed-ab32-fc707154662d	Quadrinhos e Graphic Novels	Histórias em quadrinhos e novelas gráficas	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
17f563e3-07fc-4c44-ae55-c48107ffc232	Infantil	Livros para crianças e jovens leitores	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
80f7e500-5a3d-49e9-bfab-a02500a6da91	Juvenil	Literatura para adolescentes e jovens adultos	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
ecb76f29-10d6-4d5c-a0c1-1e678039e049	Contos	Narrativas curtas e coletâneas de contos	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
f4e26a0d-813c-494c-97cf-c79537415d62	Drama	Obras dramáticas e literatura teatral	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
6a26b833-8a98-4311-ba25-9e0b389683c0	Humor	Comédia, sátira e literatura humorística	t	2026-04-30 20:28:00.616117+00	2026-04-30 20:28:00.616117+00
\.


--
-- Data for Name: collection_books; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.collection_books (collection_id, book_id) FROM stdin;
4b645463-b0b8-486c-b8f4-b8cae7e5b7f5	5302b656-5d81-4c93-8c54-4c86780f1660
4b645463-b0b8-486c-b8f4-b8cae7e5b7f5	b8c8eca8-bed6-4d77-8ee8-6ce81ee0e2c8
fb4f88a7-79cb-4a4a-8778-7434bc9ffe8c	9c8210dc-068e-4a59-9671-f45a83026e29
fb4f88a7-79cb-4a4a-8778-7434bc9ffe8c	f03f89a0-8801-40a1-b5ca-bb579f97c5b7
fb4f88a7-79cb-4a4a-8778-7434bc9ffe8c	decec4ec-e99f-4ffe-b026-a7debaddbcc0
cf480db6-eef4-4f08-ae15-2b2feb68b5b8	54d30285-4dcf-496d-9d33-c53f7478a345
cf480db6-eef4-4f08-ae15-2b2feb68b5b8	b6e438d1-88ee-4b6b-ac9a-e9a1dc0f31be
\.


--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.collections (id, title, description, cover_url, created_at, updated_at) FROM stdin;
4b645463-b0b8-486c-b8f4-b8cae7e5b7f5	Comece por Tecnologia	Livros base para quem quer mergulhar em IA e computação	https://images.example.com/collection-tech.jpg	2026-04-30 20:28:01.544252+00	2026-04-30 20:28:01.544252+00
fb4f88a7-79cb-4a4a-8778-7434bc9ffe8c	Fantasia para maratonar	Clássicos e sagas para imersão total	https://images.example.com/collection-fantasy.jpg	2026-04-30 20:28:01.544252+00	2026-04-30 20:28:01.544252+00
cf480db6-eef4-4f08-ae15-2b2feb68b5b8	Foco e produtividade	Leituras rápidas para criar bons hábitos	https://images.example.com/collection-habits.jpg	2026-04-30 20:28:01.544252+00	2026-04-30 20:28:01.544252+00
\.


--
-- Data for Name: databasechangelog; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id) FROM stdin;
1760403222215	iuri	db/migrations/1760403222215-setup.sql	2026-04-30 20:28:00.010579	1	EXECUTED	9:6e942f696e4b4880aa34acb207813e3f	sql		\N	4.31.1	\N	\N	7580871473
1760412940331	iuri	db/migrations/1760412940331-create-table-books.sql	2026-04-30 20:28:00.104362	2	EXECUTED	9:27c81c360975e591e345c828c0c28b37	sql		\N	4.31.1	\N	\N	7580871473
1760746281910	tiala	db/migrations/1760746281910-create-table-users.sql	2026-04-30 20:28:00.181297	3	EXECUTED	9:e3e407b315a246a42680f32ad7679562	sql		\N	4.31.1	\N	\N	7580871473
1760917088900	tiala	db/migrations/1760917088900-create-table-favorites.sql	2026-04-30 20:28:00.292782	4	EXECUTED	9:ef0965c1adf03da4634e12c7ad04d678	sql		\N	4.31.1	\N	\N	7580871473
1761049764925	iuri	db/migrations/1761049764925-create-table-readings.sql	2026-04-30 20:28:00.453128	5	EXECUTED	9:222aded9bc67f3a7736d70548d7ef02b	sql		\N	4.31.1	\N	\N	7580871473
1762138768629	iuri	db/migrations/1762138768629-create-table-reviews.sql	2026-04-30 20:28:00.533703	6	EXECUTED	9:302b433fc49b3e628f8020ae1871fd5f	sql		\N	4.31.1	\N	\N	7580871473
1762173430119	iuri	db/migrations/1762173430119-create-table-categories.sql	2026-04-30 20:28:00.60976	7	EXECUTED	9:980c17eecc798bbac9618194e412180c	sql		\N	4.31.1	\N	\N	7580871473
1762466339149	author	db/migrations/1762466339149-insert-categories.sql	2026-04-30 20:28:00.63811	8	EXECUTED	9:fad0224953fa7fb36143843d04d89536	sql		\N	4.31.1	\N	\N	7580871473
1762466729730	author	db/migrations/1762466729730-insert-books.sql	2026-04-30 20:28:00.689013	9	EXECUTED	9:233c06881bb361480834faffc8ab077d	sql		\N	4.31.1	\N	\N	7580871473
1763000000001	copilot	db/migrations/1763000000001-create-table-reading-goals.sql	2026-04-30 20:28:00.772121	10	EXECUTED	9:23dcbce27467a4e085278a6ebd74ebd9	sql		\N	4.31.1	\N	\N	7580871473
1763000000002	copilot	db/migrations/1763000000002-create-table-reading-sessions.sql	2026-04-30 20:28:01.008171	11	EXECUTED	9:979659696dbb162597cac903c6f126aa	sql		\N	4.31.1	\N	\N	7580871473
1763100000001	app	db/migrations/1763100000001-create-table-tags.sql	2026-04-30 20:28:01.320483	12	EXECUTED	9:e48f8c77c889e1e2fe9159464b882a4c	sql		\N	4.31.1	\N	\N	7580871473
1763100000002	app	db/migrations/1763100000002-create-table-collections.sql	2026-04-30 20:28:01.413352	13	EXECUTED	9:11c04264fbc360e691557f25281ded8c	sql		\N	4.31.1	\N	\N	7580871473
1763100000003	app	db/migrations/1763100000003-insert-tags.sql	2026-04-30 20:28:01.448283	14	EXECUTED	9:852bf1b2cf8492cdb76b44514ccec88d	sql		\N	4.31.1	\N	\N	7580871473
1763100000004	app	db/migrations/1763100000004-insert-books-with-tags.sql	2026-04-30 20:28:01.538102	15	EXECUTED	9:8714f94c691ceee6b87bf83017cebcfb	sql		\N	4.31.1	\N	\N	7580871473
1763100000005	app	db/migrations/1763100000005-insert-collections.sql	2026-04-30 20:28:01.583208	16	EXECUTED	9:11c5d43684254582b78bb08604e5be00	sql		\N	4.31.1	\N	\N	7580871473
raw	includeAll	db/migrations/1763100000006-add-engagement.sql	2026-04-30 20:28:01.631158	17	EXECUTED	9:5253b1447e0cd4595a3275d8a7a676b1	sql		\N	4.31.1	\N	\N	7580871473
1764000000001	copilot	db/migrations/1764000000001-create-table-badges.sql	2026-04-30 20:28:01.764325	18	EXECUTED	9:ca5d985478f0aac07e9c1432e12ba032	sql		\N	4.31.1	\N	\N	7580871473
1764000000002	copilot	db/migrations/1764000000002-add-badges-extended.sql	2026-04-30 20:28:01.786517	19	EXECUTED	9:cf9f1a29b1de6b8fd00a6c90fc582bbb	sql		\N	4.31.1	\N	\N	7580871473
raw	includeAll	db/migrations/1764000000003-add-alerts-optin.sql	2026-04-30 20:28:01.813775	20	EXECUTED	9:e74b20f11cff49bcdfd6797c9860ab0b	sql		\N	4.31.1	\N	\N	7580871473
1764100000001	app	db/migrations/1764100000001-create-table-alert-deliveries.sql	2026-04-30 20:28:01.857328	21	EXECUTED	9:9a8b6037b07a810ef9140a6d54f9ec99	sql		\N	4.31.1	\N	\N	7580871473
1764200000001	codex	db/migrations/1764200000001-create-table-book-narrative-beats.sql	2026-04-30 20:28:01.928168	22	EXECUTED	9:080bf5b25cfeb2d7bc7b900b8ead7202	sql		\N	4.31.1	\N	\N	7580871473
raw	includeAll	db/migrations/1764300000001-create-table-password-reset-tokens.sql	2026-04-30 20:28:01.963594	23	EXECUTED	9:d91aa20f53f0aa7adf261153e106778a	sql		\N	4.31.1	\N	\N	7580871473
1764400000001	codex	db/migrations/1764400000001-add-open-cache-columns-to-books.sql	2026-04-30 20:28:01.997513	24	EXECUTED	9:1746ebee04bc04de528d631e203f2700	sql		\N	4.31.1	\N	\N	7580871473
1764500000001	codex	db/migrations/1764500000001-add-query-performance-indexes.sql	2026-04-30 20:28:02.036812	25	EXECUTED	9:864bf1500b0e5014e255b2d49cf9df71	sql		\N	4.31.1	\N	\N	7580871473
1764600000001	codex	db/migrations/1764600000001-add-author-to-books.sql	2026-04-30 20:28:02.094519	26	EXECUTED	9:bccb41325944b790f08a0299463990cd	sql		\N	4.31.1	\N	\N	7580871473
\.


--
-- Data for Name: databasechangeloglock; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.databasechangeloglock (id, locked, lockgranted, lockedby) FROM stdin;
1	f	\N	\N
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.favorites (user_id, book_id, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: reading_goals; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.reading_goals (id, user_id, period, target_pages, progress_pages, start_date, end_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reading_sessions; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.reading_sessions (id, user_id, book_id, pages_read, duration_minutes, logged_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: readings; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.readings (id, user_id, book_id, status, current_page, started_at, last_readed_at, finished_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.reviews (id, book_id, user_id, rating, progress, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.tags (id, name, created_at, updated_at) FROM stdin;
b55e802f-da93-4b7d-b912-fb2770021bb7	Tecnologia	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
619c5713-524e-4ee6-b829-e934923f662e	Clássicos	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
257adf5d-41eb-4eed-a34c-7a2370434fb7	Fantasia	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
3e85ce2b-9919-42d9-8886-951c926db48c	Ficção Científica	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
07cf2c5c-201e-44b1-a1ad-1ed3c428dd28	Productividade	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
4eeebfb3-caca-4086-9179-6af78bda6a54	Negócios	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
d2e817ce-cf1a-40a4-8bc7-101856a0bdbc	Bem-estar	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
7c52795e-6ab7-4748-b1b6-0029753e730a	IA	2026-04-30 20:28:01.421682+00	2026-04-30 20:28:01.421682+00
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.user_badges (id, user_id, badge_id, awarded_at, source_event, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: library
--

COPY public.users (id, name, email, password, active, role, created_at, updated_at, leaderboard_opt_in, alerts_opt_in) FROM stdin;
\.


--
-- Name: alert_deliveries alert_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.alert_deliveries
    ADD CONSTRAINT alert_deliveries_pkey PRIMARY KEY (id);


--
-- Name: badge_definitions badge_definitions_code_key; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_code_key UNIQUE (code);


--
-- Name: badge_definitions badge_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (book_id, category_id);


--
-- Name: book_narrative_beats book_narrative_beats_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_narrative_beats
    ADD CONSTRAINT book_narrative_beats_pkey PRIMARY KEY (id);


--
-- Name: book_tags book_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_tags
    ADD CONSTRAINT book_tags_pkey PRIMARY KEY (book_id, tag_id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: collection_books collection_books_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT collection_books_pkey PRIMARY KEY (collection_id, book_id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (user_id, book_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: reading_goals reading_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reading_goals
    ADD CONSTRAINT reading_goals_pkey PRIMARY KEY (id);


--
-- Name: reading_sessions reading_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reading_sessions
    ADD CONSTRAINT reading_sessions_pkey PRIMARY KEY (id);


--
-- Name: readings readings_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.readings
    ADD CONSTRAINT readings_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_badges uk_user_badges_user_badge; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT uk_user_badges_user_badge UNIQUE (user_id, badge_id);


--
-- Name: book_narrative_beats uq_book_narrative_start; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_narrative_beats
    ADD CONSTRAINT uq_book_narrative_start UNIQUE (book_id, start_page);


--
-- Name: books uq_books_isbn; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT uq_books_isbn UNIQUE (isbn);


--
-- Name: categories uq_categories_name; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uq_categories_name UNIQUE (name);


--
-- Name: reviews uq_reviews_user_book; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT uq_reviews_user_book UNIQUE (user_id, book_id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_alert_deliveries_created; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_alert_deliveries_created ON public.alert_deliveries USING btree (created_at DESC);


--
-- Name: idx_alert_deliveries_user_created; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_alert_deliveries_user_created ON public.alert_deliveries USING btree (user_id, created_at DESC);


--
-- Name: idx_book_categories_book_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_book_categories_book_id ON public.book_categories USING btree (book_id);


--
-- Name: idx_book_categories_category_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_book_categories_category_id ON public.book_categories USING btree (category_id);


--
-- Name: idx_book_narrative_beats_book_page; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_book_narrative_beats_book_page ON public.book_narrative_beats USING btree (book_id, start_page, end_page);


--
-- Name: idx_book_tags_book_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_book_tags_book_id ON public.book_tags USING btree (book_id);


--
-- Name: idx_book_tags_tag_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_book_tags_tag_id ON public.book_tags USING btree (tag_id);


--
-- Name: idx_books_author_lower; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_books_author_lower ON public.books USING btree (lower((author)::text));


--
-- Name: idx_books_available_pdf_true; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_books_available_pdf_true ON public.books USING btree (available, has_pdf) WHERE ((available = true) AND (has_pdf = true));


--
-- Name: idx_books_available_publication_date; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_books_available_publication_date ON public.books USING btree (available, publication_date DESC) WHERE (available = true);


--
-- Name: idx_books_isbn; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_books_isbn ON public.books USING btree (isbn);


--
-- Name: idx_books_source_last_seen_at; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_books_source_last_seen_at ON public.books USING btree (source, last_seen_at);


--
-- Name: idx_books_title_lower; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_books_title_lower ON public.books USING btree (lower((title)::text));


--
-- Name: idx_collection_books_book; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_collection_books_book ON public.collection_books USING btree (book_id);


--
-- Name: idx_collection_books_collection; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_collection_books_collection ON public.collection_books USING btree (collection_id);


--
-- Name: idx_favorites_book_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_favorites_book_id ON public.favorites USING btree (book_id);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_reading_goals_user_period; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_reading_goals_user_period ON public.reading_goals USING btree (user_id, period, start_date DESC);


--
-- Name: idx_reading_sessions_book_logged_at; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_reading_sessions_book_logged_at ON public.reading_sessions USING btree (book_id, logged_at DESC);


--
-- Name: idx_reading_sessions_user_logged_at; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_reading_sessions_user_logged_at ON public.reading_sessions USING btree (user_id, logged_at DESC);


--
-- Name: idx_readings_book_history; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_readings_book_history ON public.readings USING btree (book_id, finished_at DESC) WHERE ((status)::text = 'FINISHED'::text);


--
-- Name: idx_readings_book_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_readings_book_id ON public.readings USING btree (book_id);


--
-- Name: idx_readings_status; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_readings_status ON public.readings USING btree (status);


--
-- Name: idx_readings_user_book_status; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_readings_user_book_status ON public.readings USING btree (user_id, book_id, status);


--
-- Name: idx_readings_user_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_readings_user_id ON public.readings USING btree (user_id);


--
-- Name: idx_recent_readings_user; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_recent_readings_user ON public.readings USING btree (user_id, last_readed_at DESC);


--
-- Name: idx_reviews_book_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_reviews_book_id ON public.reviews USING btree (book_id);


--
-- Name: idx_reviews_user_id; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: library
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: uk_readings_user_book_active; Type: INDEX; Schema: public; Owner: library
--

CREATE UNIQUE INDEX uk_readings_user_book_active ON public.readings USING btree (user_id, book_id) WHERE ((status)::text = 'IN_PROGRESS'::text);


--
-- Name: badge_definitions tg_badge_definitions_updated; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER tg_badge_definitions_updated BEFORE UPDATE ON public.badge_definitions FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at_badge_definitions();


--
-- Name: reading_goals tg_reading_goals_updated; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER tg_reading_goals_updated BEFORE UPDATE ON public.reading_goals FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at_reading_goals();


--
-- Name: reading_sessions tg_reading_sessions_updated; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER tg_reading_sessions_updated BEFORE UPDATE ON public.reading_sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at_reading_sessions();


--
-- Name: user_badges tg_user_badges_updated; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER tg_user_badges_updated BEFORE UPDATE ON public.user_badges FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at_user_badges();


--
-- Name: books trigger_updated_at; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: categories trigger_updated_at; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: readings trigger_updated_at; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.readings FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: reviews trigger_updated_at; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: users trigger_updated_at; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: collections trigger_updated_at_collections; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at_collections BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: tags trigger_updated_at_tags; Type: TRIGGER; Schema: public; Owner: library
--

CREATE TRIGGER trigger_updated_at_tags BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();


--
-- Name: book_narrative_beats book_narrative_beats_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_narrative_beats
    ADD CONSTRAINT book_narrative_beats_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: alert_deliveries fk_alert_deliveries_user; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.alert_deliveries
    ADD CONSTRAINT fk_alert_deliveries_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: book_categories fk_book_categories_book; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT fk_book_categories_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_categories fk_book_categories_category; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT fk_book_categories_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: book_tags fk_book_tags_book; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_tags
    ADD CONSTRAINT fk_book_tags_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_tags fk_book_tags_tag; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.book_tags
    ADD CONSTRAINT fk_book_tags_tag FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: collection_books fk_collection_books_book; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT fk_collection_books_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: collection_books fk_collection_books_collection; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.collection_books
    ADD CONSTRAINT fk_collection_books_collection FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;


--
-- Name: favorites fk_favorites_book; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_favorites_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: favorites fk_favorites_user; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reading_goals fk_reading_goals_user; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reading_goals
    ADD CONSTRAINT fk_reading_goals_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reading_sessions fk_reading_sessions_book; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reading_sessions
    ADD CONSTRAINT fk_reading_sessions_book FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: reading_sessions fk_reading_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reading_sessions
    ADD CONSTRAINT fk_reading_sessions_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reviews fk_reviews_book; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: reviews fk_reviews_user; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_badges fk_user_badges_badge; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES public.badge_definitions(id);


--
-- Name: user_badges fk_user_badges_user; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: readings readings_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.readings
    ADD CONSTRAINT readings_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: readings readings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: library
--

ALTER TABLE ONLY public.readings
    ADD CONSTRAINT readings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict JEHdJuD7b6jUFCOFY56MPJhgfcgfYLNjYiDDuEOJ6nd7TytwXogug9WcKtFPZ26

