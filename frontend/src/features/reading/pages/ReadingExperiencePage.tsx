import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";

type BookDetail = {
  id: string;
  title: string;
  isbn?: string;
  pdfUrl?: string | null;
  numberOfPages: number;
  hasPdf: boolean;
};

type NarrativeCharacter = {
  name: string;
  role: string;
  note: string;
};

type NarrativeQuiz = {
  id: string;
  question: string;
  options: string[];
  correctOption: string;
  explanation: string;
};

type NarrativeAchievement = {
  code: string;
  title: string;
  description: string;
  flashcardSymbol: string;
  unlockPage: number;
  unlocked: boolean;
};

type NarrativeInsight = {
  bookId: string;
  currentPage: number;
  phase: "BEGINNING" | "MIDDLE" | "CLIMAX" | null;
  beatTitle: string | null;
  plotState: string;
  knownCharacters: NarrativeCharacter[];
  quizzes: NarrativeQuiz[];
  achievements: NarrativeAchievement[];
};

type HomeReading = {
  id: string;
  status: string;
  currentPage: number;
  progress: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  lastReadedAt?: string | null;
  book: {
    id: string;
    title: string;
  };
};

type HomeResumeResponse = {
  readings: HomeReading[];
};

type ReadingSyncResponse = {
  id: string;
  status: string;
  currentPage: number;
  progress: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  lastReadedAt?: string | null;
};

type CachedReaderLookup = {
  embedUrl: string | null;
  fallbackUrl: string | null;
  cachedAt: number;
};

const PHASE_LABEL: Record<string, string> = {
  BEGINNING: "Inicio",
  MIDDLE: "Meio",
  CLIMAX: "Climax",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Nao iniciado",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Concluido",
  DROPPED: "Interrompido",
  READING: "Em leitura",
};

const OPEN_LIBRARY_READER_CACHE_KEY = "library.openlibrary.reader-cache.v1";
const OPEN_LIBRARY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

function getReaderCacheKey(book: BookDetail): string {
  return `${book.id}::${book.isbn ?? ""}::${book.title}`.toLowerCase();
}

function readReaderCache(book: BookDetail): CachedReaderLookup | null {
  const raw = localStorage.getItem(OPEN_LIBRARY_READER_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, CachedReaderLookup>;
    const value = parsed[getReaderCacheKey(book)];
    if (!value) return null;
    if (Date.now() - value.cachedAt > OPEN_LIBRARY_CACHE_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
}

function writeReaderCache(book: BookDetail, value: Omit<CachedReaderLookup, "cachedAt">) {
  const raw = localStorage.getItem(OPEN_LIBRARY_READER_CACHE_KEY);
  let parsed: Record<string, CachedReaderLookup> = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, CachedReaderLookup>;
    } catch {
      parsed = {};
    }
  }

  parsed[getReaderCacheKey(book)] = {
    ...value,
    cachedAt: Date.now(),
  };

  localStorage.setItem(OPEN_LIBRARY_READER_CACHE_KEY, JSON.stringify(parsed));
}

function clampPage(value: number, totalPages: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.round(value), Math.max(totalPages, 1)));
}

function formatStatusLabel(status?: string | null): string {
  if (!status) return "Nao iniciado";
  return STATUS_LABEL[status] ?? status;
}

function formatDateLabel(value?: string | null): string {
  if (!value) return "Sem registro";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem registro";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export function ReadingExperiencePage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { auth } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [readingSnapshot, setReadingSnapshot] = useState<HomeReading | ReadingSyncResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [insight, setInsight] = useState<NarrativeInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [externalReaderEmbedUrl, setExternalReaderEmbedUrl] = useState<string | null>(null);
  const [externalReaderFallbackUrl, setExternalReaderFallbackUrl] = useState<string | null>(null);
  const [externalReaderLoading, setExternalReaderLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = useMemo(
    () => (auth ? { Authorization: `Bearer ${auth.token}` } : undefined),
    [auth]
  );

  const totalPages = Math.max(book?.numberOfPages ?? 1, 1);
  const derivedProgress = Math.round((currentPage / totalPages) * 100);
  const progressPercent = Math.max(0, Math.min(100, readingSnapshot?.progress ?? derivedProgress));
  const pagesRemaining = Math.max(totalPages - currentPage, 0);
  const phaseLabel = insight?.phase ? PHASE_LABEL[insight.phase] ?? insight.phase : "Nao definida";

  const internalPdfUrl = useMemo(() => {
    if (!book?.id || !book.hasPdf) return null;
    const baseUrl = (api.defaults.baseURL as string | undefined) ?? window.location.origin;
    return `${baseUrl}/api/v1/books/${book.id}/pdf`;
  }, [book?.id, book?.hasPdf]);

  useEffect(() => {
    if (!bookId) return;

    let isActive = true;
    setLoading(true);

    const loadPage = async () => {
      try {
        const bookRequest = api.get<BookDetail>(`/api/v1/books/${bookId}`);
        const homeRequest = headers
          ? api.get<HomeResumeResponse>("/api/v1/home/resume", { headers })
          : Promise.resolve(null);

        const [bookResponse, homeResponse] = await Promise.all([bookRequest, homeRequest]);
        if (!isActive) return;

        const loadedBook = bookResponse.data;
        const savedReading =
          homeResponse?.data.readings.find((reading) => reading.book.id === bookId) ?? null;

        setBook(loadedBook);
        setReadingSnapshot(savedReading);
        setCurrentPage(clampPage(savedReading?.currentPage ?? 1, loadedBook.numberOfPages));
        setError("");
      } catch {
        if (!isActive) return;
        setBook(null);
        setReadingSnapshot(null);
        setError("Nao foi possivel carregar os detalhes da leitura.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadPage();

    return () => {
      isActive = false;
    };
  }, [bookId, headers]);

  useEffect(() => {
    if (!book) return;
    setCurrentPage((previous) => clampPage(previous, book.numberOfPages));
  }, [book]);

  useEffect(() => {
    if (!bookId || !headers || !book) return;

    api
      .get<NarrativeInsight>(`/api/v1/readings/${bookId}/narrative?currentPage=${currentPage}`, { headers })
      .then((response) => {
        setInsight(response.data);
        setSelectedOptions({});
        setRevealed({});
        setError("");
      })
      .catch(() => setError("Nao foi possivel carregar o estado narrativo para essa pagina."));
  }, [bookId, headers, currentPage, book]);

  useEffect(() => {
    if (!book || book.hasPdf) {
      setExternalReaderEmbedUrl(null);
      setExternalReaderFallbackUrl(null);
      setExternalReaderLoading(false);
      return;
    }

    const cacheHit = readReaderCache(book);
    if (cacheHit) {
      setExternalReaderEmbedUrl(cacheHit.embedUrl);
      setExternalReaderFallbackUrl(cacheHit.fallbackUrl);
      setExternalReaderLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadOpenLibraryReader = async () => {
      setExternalReaderLoading(true);
      try {
        const searchQuery = book.isbn?.trim() ? `isbn:${book.isbn.trim()}` : book.title;
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=5`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("open-library-unavailable");

        const data = (await response.json()) as {
          docs?: Array<{
            key?: string;
            ia?: string[] | string;
            edition_key?: string[];
            availability?: { identifier?: string };
          }>;
        };

        const docs = data.docs ?? [];
        const preferred = docs.find((doc) => doc.availability?.identifier || doc.ia || doc.edition_key?.length) ?? docs[0];

        const iaIdentifier =
          preferred?.availability?.identifier ??
          (Array.isArray(preferred?.ia) ? preferred?.ia[0] : preferred?.ia);

        if (!isActive) return;

        if (iaIdentifier) {
          const fallbackUrl = `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`;
          writeReaderCache(book, {
            embedUrl: `https://archive.org/embed/${iaIdentifier}`,
            fallbackUrl,
          });
          setExternalReaderEmbedUrl(`https://archive.org/embed/${iaIdentifier}`);
          setExternalReaderFallbackUrl(fallbackUrl);
          return;
        }

        if (preferred?.key) {
          writeReaderCache(book, {
            embedUrl: null,
            fallbackUrl: `https://openlibrary.org${preferred.key}`,
          });
          setExternalReaderFallbackUrl(`https://openlibrary.org${preferred.key}`);
        } else {
          const fallbackUrl = `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`;
          writeReaderCache(book, { embedUrl: null, fallbackUrl });
          setExternalReaderFallbackUrl(fallbackUrl);
        }
      } catch {
        if (!isActive) return;
        const fallbackUrl = `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`;
        writeReaderCache(book, { embedUrl: null, fallbackUrl });
        setExternalReaderFallbackUrl(fallbackUrl);
      } finally {
        if (isActive) setExternalReaderLoading(false);
      }
    };

    void loadOpenLibraryReader();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [book]);

  const updateCurrentPage = (value: number) => {
    setCurrentPage(clampPage(value, totalPages));
  };

  const jumpPages = (delta: number) => {
    updateCurrentPage(currentPage + delta);
  };

  const syncReading = async () => {
    if (!bookId || !headers) return;
    setSaving(true);
    try {
      const response = await api.post<ReadingSyncResponse>(
        "/api/v1/readings",
        {
          bookId,
          currentPage,
        },
        { headers }
      );

      setReadingSnapshot(response.data);
      setCurrentPage(clampPage(response.data.currentPage, totalPages));
      setError("");
      showToast("Progresso de leitura salvo.", "success");
    } catch {
      setError("Falha ao sincronizar progresso de leitura.");
      showToast("Nao foi possivel salvar o progresso.", "error");
    } finally {
      setSaving(false);
    }
  };

  const onSelectOption = (quizId: string, option: string) => {
    setSelectedOptions((previous) => ({ ...previous, [quizId]: option }));
    setRevealed((previous) => ({ ...previous, [quizId]: false }));
  };

  const onCheckQuiz = (quizId: string) => {
    setRevealed((previous) => ({ ...previous, [quizId]: true }));
  };

  if (!bookId) {
    return <section className="card error">Livro nao informado.</section>;
  }

  if (loading) {
    return <section className="card">Carregando leitura...</section>;
  }

  return (
    <section className="grid">
      <article className="card hero">
        <div className="section-head">
          <div>
            <h2>{book?.title ?? "Leitura"}</h2>
            <p>
              Retome sua leitura, acompanhe a fase narrativa e salve o progresso sem sair da experiencia.
            </p>
          </div>
          <span className="kpi">{progressPercent}% concluido</span>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <strong>{currentPage}</strong>
            <span>pagina atual</span>
          </div>
          <div className="stat-box">
            <strong>{totalPages}</strong>
            <span>paginas totais</span>
          </div>
          <div className="stat-box">
            <strong>{pagesRemaining}</strong>
            <span>paginas restantes</span>
          </div>
          <div className="stat-box">
            <strong>{formatStatusLabel(readingSnapshot?.status)}</strong>
            <span>status da leitura</span>
          </div>
        </div>

        <p className="quote">{insight?.plotState ?? "Acompanhe sua narrativa por trecho lido."}</p>

        <div className="card-actions">
          <button type="button" onClick={syncReading} disabled={saving || !book?.hasPdf}>
            {saving ? "Salvando..." : "Salvar progresso"}
          </button>
          <Link to="/books" className="btn-link">
            Voltar ao catalogo
          </Link>
          {book?.hasPdf && internalPdfUrl && (
            <a className="btn-link" href={internalPdfUrl} target="_blank" rel="noreferrer">
              Abrir leitor
            </a>
          )}
          {!book?.hasPdf && externalReaderFallbackUrl && (
            <a className="btn-link" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
              Abrir fonte externa
            </a>
          )}
        </div>
      </article>

      {book?.hasPdf && (
        <article className="card">
          <div className="section-head">
            <h3>Leitor interno</h3>
            <span className="kpi">PDF local</span>
          </div>
          {internalPdfUrl ? (
            <>
              <div className="external-reader-wrap">
                <iframe
                  title={`Leitor PDF - ${book.title}`}
                  src={internalPdfUrl}
                  className="external-reader-frame"
                  loading="lazy"
                />
              </div>
              <div className="card-actions">
                <a className="btn-muted btn-link" href={internalPdfUrl} target="_blank" rel="noreferrer">
                  Abrir em nova aba
                </a>
                <a className="btn-muted btn-link" href={`${internalPdfUrl}?download=true`}>
                  Baixar PDF
                </a>
              </div>
            </>
          ) : (
            <p className="section-sub">
              O PDF deste livro existe, mas a URL de leitura ainda nao esta disponivel. Tente novamente em instantes.
            </p>
          )}
        </article>
      )}

      {book && !book.hasPdf && (
        <article className="card">
          <div className="section-head">
            <h3>Leitura online</h3>
            <span className="kpi">Livro importado</span>
          </div>
          {externalReaderLoading && <p className="section-sub">Preparando leitor online...</p>}
          {!externalReaderLoading && externalReaderEmbedUrl && (
            <div className="external-reader-wrap">
              <iframe
                title={`Leitor online - ${book.title}`}
                src={externalReaderEmbedUrl}
                className="external-reader-frame"
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
          {!externalReaderLoading && !externalReaderEmbedUrl && (
            <p className="section-sub">
              Nao encontramos uma versao incorporavel deste livro. Use o link oficial para continuar a leitura fora da plataforma.
            </p>
          )}
          {externalReaderFallbackUrl && (
            <div className="card-actions">
              <a className="btn-link btn-muted" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
                Abrir no Open Library
              </a>
            </div>
          )}
        </article>
      )}

      <article className="card">
        <div className="section-head">
          <div>
            <h3>Painel de progresso</h3>
            <p className="section-sub">
              Ajuste a pagina atual e registre o que foi lido para refletir metas, ranking e badges.
            </p>
          </div>
          <span className="kpi">Fase: {phaseLabel}</span>
        </div>

        {!book?.hasPdf && (
          <p className="section-sub">
            Para livros sem PDF local, esta tela prioriza consulta e contexto narrativo. O salvamento manual pode ficar indisponivel.
          </p>
        )}

        <div className="stats-grid">
          <div className="stat-box">
            <strong>{readingSnapshot?.currentPage ?? currentPage}</strong>
            <span>ultima pagina salva</span>
          </div>
          <div className="stat-box">
            <strong>{formatDateLabel(readingSnapshot?.lastReadedAt)}</strong>
            <span>ultima sincronizacao</span>
          </div>
          <div className="stat-box">
            <strong>{formatDateLabel(readingSnapshot?.startedAt)}</strong>
            <span>inicio da leitura</span>
          </div>
          <div className="stat-box">
            <strong>{formatDateLabel(readingSnapshot?.finishedAt)}</strong>
            <span>conclusao</span>
          </div>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="reading-control-row">
          <div>
            <label htmlFor="reading-range">Selecione a pagina lida</label>
            <input
              id="reading-range"
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              disabled={!book?.hasPdf}
              onChange={(event) => updateCurrentPage(Number(event.target.value))}
            />
          </div>

          <div className="reading-page-box">
            <label htmlFor="reading-page-input">Pagina</label>
            <input
              id="reading-page-input"
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              disabled={!book?.hasPdf}
              onChange={(event) => updateCurrentPage(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="page-jump-grid">
          <button type="button" className="btn-muted" disabled={!book?.hasPdf} onClick={() => updateCurrentPage(1)}>
            Ir para inicio
          </button>
          <button type="button" className="btn-muted" disabled={!book?.hasPdf} onClick={() => jumpPages(-10)}>
            Voltar 10 pags
          </button>
          <button type="button" className="btn-muted" disabled={!book?.hasPdf} onClick={() => jumpPages(10)}>
            Avancar 10 pags
          </button>
          <button type="button" className="btn-muted" disabled={!book?.hasPdf} onClick={() => updateCurrentPage(totalPages)}>
            Ir para final
          </button>
        </div>

        <p className="section-sub">
          Beat atual: {insight?.beatTitle ?? "Sem beat definido para a pagina selecionada."}
        </p>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Contexto narrativo</h3>
          <span className="kpi">{phaseLabel}</span>
        </div>
        <p>{insight?.plotState ?? "Sem resumo narrativo disponivel para este trecho."}</p>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Quem e quem</h3>
          <span className="kpi">{insight?.knownCharacters?.length ?? 0} personagem(ns)</span>
        </div>
        {insight?.knownCharacters?.length ? (
          <ul className="stacked-list">
            {insight.knownCharacters.map((character) => (
              <li key={`${character.name}-${character.role}`} className="stacked-list-item">
                <div>
                  <strong>{character.name}</strong>
                  <p className="section-sub">{character.role}</p>
                </div>
                <span>{character.note}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Nenhum personagem mapeado neste trecho.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Quiz do trecho</h3>
          <span className="kpi">{insight?.quizzes?.length ?? 0} pergunta(s)</span>
        </div>
        {insight?.quizzes?.length ? (
          <div className="quiz-list">
            {insight.quizzes.map((quiz) => (
              <article key={quiz.id} className="quiz-card">
                <h4>{quiz.question}</h4>
                <div className="quiz-options">
                  {quiz.options.map((option) => {
                    const selected = selectedOptions[quiz.id] === option;
                    const isCorrect = quiz.correctOption === option;
                    const showResult = revealed[quiz.id];
                    const className = showResult
                      ? isCorrect
                        ? "quiz-option correct"
                        : selected
                          ? "quiz-option wrong"
                          : "quiz-option"
                      : selected
                        ? "quiz-option selected"
                        : "quiz-option";

                    return (
                      <button
                        key={option}
                        type="button"
                        className={className}
                        onClick={() => onSelectOption(quiz.id, option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn-muted"
                    onClick={() => onCheckQuiz(quiz.id)}
                    disabled={!selectedOptions[quiz.id]}
                  >
                    Verificar resposta
                  </button>
                </div>
                {revealed[quiz.id] && (
                  <small>
                    {selectedOptions[quiz.id] === quiz.correctOption ? "Correto. " : "Incorreto. "}
                    {quiz.explanation}
                  </small>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="section-sub">Nenhum quiz para a pagina selecionada.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Conquistas e flashcards</h3>
          <span className="kpi">{insight?.achievements?.length ?? 0} item(ns)</span>
        </div>
        {insight?.achievements?.length ? (
          <div className="flashcards">
            {insight.achievements.map((achievement) => (
              <article
                key={achievement.code}
                className={achievement.unlocked ? "flashcard unlocked" : "flashcard locked"}
              >
                <p className="flash-symbol">{achievement.flashcardSymbol ?? "CARD"}</p>
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                <small>
                  {achievement.unlocked
                    ? "Desbloqueado"
                    : `Bloqueado ate pagina ${achievement.unlockPage ?? "?"}`}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <p className="section-sub">Sem conquistas mapeadas para este livro.</p>
        )}
      </article>

      {error && <article className="card error">{error}</article>}
    </section>
  );
}
