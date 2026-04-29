import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { readReaderCache, writeReaderCache } from "../lib/readerCache";
import { clampPage, formatStatusLabel, getPhaseLabel } from "../lib/readingPresentation";
import { AchievementsPanel } from "../components/AchievementsPanel";
import { CharactersPanel } from "../components/CharactersPanel";
import { ExternalReaderPanel } from "../components/ExternalReaderPanel";
import { InternalPdfReaderPanel } from "../components/InternalPdfReaderPanel";
import { NarrativeContextPanel } from "../components/NarrativeContextPanel";
import { QuizPanel } from "../components/QuizPanel";
import { ReadingHeroPanel } from "../components/ReadingHeroPanel";
import { ReadingProgressPanel } from "../components/ReadingProgressPanel";
import type {
  BookDetail,
  Favorite,
  HomeReading,
  HomeResumeResponse,
  NarrativeInsight,
  ReadingSyncResponse,
} from "../types";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [externalReaderEmbedUrl, setExternalReaderEmbedUrl] = useState<string | null>(null);
  const [externalReaderFallbackUrl, setExternalReaderFallbackUrl] = useState<string | null>(null);
  const [externalReaderLoading, setExternalReaderLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = useMemo(
    () => (auth ? { Authorization: `Bearer ${auth.token}` } : undefined),
    [auth]
  );

  const totalPages = Math.max(book?.numberOfPages ?? 1, 1);
  const isExternalReading = Boolean(book && !book.hasPdf);
  const sourceLabel = book?.source === "OPEN" ? "Open Library" : book?.hasPdf ? "PDF local" : "Catalogo";
  const derivedProgress = Math.round((currentPage / totalPages) * 100);
  const progressPercent = Math.max(0, Math.min(100, readingSnapshot?.progress ?? derivedProgress));
  const pagesRemaining = Math.max(totalPages - currentPage, 0);
  const phaseLabel = getPhaseLabel(insight?.phase);
  const externalSourceActionLabel =
    book?.source === "OPEN" ? "Continuar na Open Library" : "Continuar na fonte externa";

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
        const savedReading = homeResponse?.data.readings.find((reading) => reading.book.id === bookId) ?? null;

        setBook(loadedBook);
        setReadingSnapshot(savedReading);
        setCurrentPage(clampPage(savedReading?.currentPage ?? 1, loadedBook.numberOfPages));
        setError("");
      } catch (error) {
        if (!isActive) return;
        setBook(null);
        setReadingSnapshot(null);
        setError(extractApiErrorMessage(error, "Nao foi possivel carregar os detalhes da leitura."));
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
    if (!headers || !bookId) return;

    api
      .get<Favorite[]>("/api/v1/users/me/favorites", { headers })
      .then((response) => {
        setIsFavorite(response.data.some((item) => item.bookId === bookId));
      })
      .catch(() => {
        setIsFavorite(false);
      });
  }, [headers, bookId]);

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
      .catch((error) =>
        setError(extractApiErrorMessage(error, "Nao foi possivel carregar o estado narrativo para essa pagina."))
      );
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
        const preferred =
          docs.find((doc) => doc.availability?.identifier || doc.ia || doc.edition_key?.length) ?? docs[0];

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
    } catch (error) {
      const message = extractApiErrorMessage(error, "Nao foi possivel salvar o progresso.");
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async () => {
    if (!headers || !bookId) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
        setIsFavorite(false);
        showToast("Livro removido dos favoritos.", "success");
      } else {
        await api.post("/api/v1/users/me/favorites", { bookId }, { headers });
        setIsFavorite(true);
        showToast("Livro adicionado aos favoritos.", "success");
      }
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Nao foi possivel atualizar favorito."), "error");
    } finally {
      setFavoriteLoading(false);
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
    return (
      <StateCard
        title="Livro nao informado"
        message="Selecione um livro valido para abrir a experiencia de leitura."
        variant="error"
        action={
          <Link to="/books" className="btn-link">
            Voltar ao catalogo
          </Link>
        }
      />
    );
  }

  if (loading) {
    return (
      <StateCard
        title="Carregando leitura"
        message="Estamos preparando o livro, o progresso salvo e o contexto narrativo."
        variant="loading"
      />
    );
  }

  if (!book) {
    return (
      <StateCard
        title="Leitura indisponivel"
        message={error || "Nao foi possivel carregar os detalhes da leitura."}
        variant="error"
        action={
          <Link to="/books" className="btn-link">
            Voltar ao catalogo
          </Link>
        }
      />
    );
  }

  return (
    <section className="grid">
      <ReadingHeroPanel
        book={book}
        currentPage={currentPage}
        totalPages={totalPages}
        pagesRemaining={pagesRemaining}
        progressPercent={progressPercent}
        readingStatusLabel={formatStatusLabel(readingSnapshot?.status)}
        isExternalReading={isExternalReading}
        plotState={insight?.plotState}
        saving={saving}
        isFavorite={isFavorite}
        favoriteLoading={favoriteLoading}
        internalPdfUrl={internalPdfUrl}
        externalReaderFallbackUrl={externalReaderFallbackUrl}
        onSyncReading={syncReading}
        onToggleFavorite={toggleFavorite}
      />

      {book.hasPdf ? <InternalPdfReaderPanel bookTitle={book.title} internalPdfUrl={internalPdfUrl} /> : null}

      {!book.hasPdf ? (
        <ExternalReaderPanel
          book={book}
          sourceLabel={sourceLabel}
          externalReaderLoading={externalReaderLoading}
          externalReaderEmbedUrl={externalReaderEmbedUrl}
          externalReaderFallbackUrl={externalReaderFallbackUrl}
          externalSourceActionLabel={externalSourceActionLabel}
          saving={saving}
          onSyncReading={syncReading}
        />
      ) : null}

      <ReadingProgressPanel
        hasPdf={book.hasPdf}
        phaseLabel={phaseLabel}
        readingSnapshot={readingSnapshot}
        currentPage={currentPage}
        totalPages={totalPages}
        progressPercent={progressPercent}
        insight={insight}
        onUpdateCurrentPage={updateCurrentPage}
        onJumpPages={jumpPages}
      />

      <NarrativeContextPanel phaseLabel={phaseLabel} plotState={insight?.plotState} />
      <CharactersPanel characters={insight?.knownCharacters ?? []} />
      <QuizPanel
        quizzes={insight?.quizzes ?? []}
        selectedOptions={selectedOptions}
        revealed={revealed}
        onSelectOption={onSelectOption}
        onCheckQuiz={onCheckQuiz}
      />
      <AchievementsPanel achievements={insight?.achievements ?? []} />

      {error ? <article className="card error">{error}</article> : null}
    </section>
  );
}
