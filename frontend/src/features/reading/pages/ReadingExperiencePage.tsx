import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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

const PHASE_LABEL: Record<string, string> = {
  BEGINNING: "Inicio",
  MIDDLE: "Meio",
  CLIMAX: "Climax",
};

type CachedReaderLookup = {
  embedUrl: string | null;
  fallbackUrl: string | null;
  cachedAt: number;
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

export function ReadingExperiencePage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { auth } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState<BookDetail | null>(null);
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

  const internalPdfUrl = useMemo(() => {
    if (!book?.id || !book.hasPdf) return null;
    const baseUrl = (api.defaults.baseURL as string | undefined) ?? window.location.origin;
    return `${baseUrl}/api/v1/books/${book.id}/pdf`;
  }, [book?.id, book?.hasPdf]);

  const headers = useMemo(
    () => (auth ? { Authorization: `Bearer ${auth.token}` } : undefined),
    [auth]
  );

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    api
      .get<BookDetail>(`/api/v1/books/${bookId}`)
      .then((response) => {
        setBook(response.data);
        setCurrentPage(1);
      })
      .catch(() => setError("Nao foi possivel carregar os detalhes do livro."))
      .finally(() => setLoading(false));
  }, [bookId]);

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
          writeReaderCache(book, {
            embedUrl: `https://archive.org/embed/${iaIdentifier}`,
            fallbackUrl: `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`,
          });
          setExternalReaderEmbedUrl(`https://archive.org/embed/${iaIdentifier}`);
          setExternalReaderFallbackUrl(`https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`);
          return;
        }

        if (preferred?.key) {
          writeReaderCache(book, {
            embedUrl: null,
            fallbackUrl: `https://openlibrary.org${preferred.key}`,
          });
          setExternalReaderFallbackUrl(`https://openlibrary.org${preferred.key}`);
        } else {
          writeReaderCache(book, {
            embedUrl: null,
            fallbackUrl: `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`,
          });
          setExternalReaderFallbackUrl(`https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`);
        }
      } catch {
        if (!isActive) return;
        writeReaderCache(book, {
          embedUrl: null,
          fallbackUrl: `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`,
        });
        setExternalReaderFallbackUrl(`https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`);
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

  const syncReading = async () => {
    if (!bookId || !headers) return;
    setSaving(true);
    try {
      await api.post(
        "/api/v1/readings",
        {
          bookId,
          currentPage,
        },
        { headers }
      );
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
    setSelectedOptions((prev) => ({ ...prev, [quizId]: option }));
    setRevealed((prev) => ({ ...prev, [quizId]: false }));
  };

  const onCheckQuiz = (quizId: string) => {
    setRevealed((prev) => ({ ...prev, [quizId]: true }));
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
        <h2>{book?.title ?? "Leitura"}</h2>
        <p>Pagina atual: {currentPage}</p>
        <p className="quote">{insight?.plotState ?? "Acompanhe sua narrativa por trecho lido."}</p>
      </article>

      {book?.hasPdf && (
        <article className="card">
          <div className="section-head">
            <h3>Leitor interno</h3>
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
                  Baixar PDF (opcional)
                </a>
              </div>
            </>
          ) : (
            <p className="section-sub">
              O PDF deste livro existe, mas a URL de leitura ainda nao esta disponivel. Tente atualizar em instantes.
            </p>
          )}
        </article>
      )}

      {book && !book.hasPdf && (
        <article className="card">
          <div className="section-head">
            <h3>Leitura online</h3>
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
              Nao encontramos uma versao incorporavel deste livro. Use o botao abaixo para abrir a pagina oficial.
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
          <h3>Progresso</h3>
          <span className="kpi">
            Fase: {insight?.phase ? PHASE_LABEL[insight.phase] ?? insight.phase : "Nao definida"}
          </span>
        </div>
        {book && !book.hasPdf && (
          <p className="section-sub">
            Para livros importados sem PDF local, o progresso manual pode ficar indisponivel em alguns casos.
          </p>
        )}
        <p className="section-sub">{insight?.beatTitle ?? "Sem beat definido para a pagina atual."}</p>
        <label>Selecione a pagina lida</label>
        <input
          type="range"
          min={1}
          max={Math.max(book?.numberOfPages ?? 1, 1)}
          value={currentPage}
          disabled={!book?.hasPdf}
          onChange={(event) => setCurrentPage(Number(event.target.value))}
        />
        <label>Pagina</label>
        <input
          type="number"
          min={1}
          max={book?.numberOfPages ?? 1}
          value={currentPage}
          disabled={!book?.hasPdf}
          onChange={(event) => setCurrentPage(Number(event.target.value))}
        />
        <button onClick={syncReading} disabled={saving || !book?.hasPdf}>
          {saving ? "Salvando..." : "Salvar progresso"}
        </button>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Quem e quem</h3>
        </div>
        {insight?.knownCharacters?.length ? (
          <ul>
            {insight.knownCharacters.map((character) => (
              <li key={`${character.name}-${character.role}`}>
                <strong>{character.name}</strong> ({character.role}) - {character.note}
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

