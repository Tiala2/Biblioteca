import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatReadingMode } from "@shared/lib/presentation";
import { readReaderCache, writeReaderCache } from "../lib/readerCache";
import { clampPage, formatStatusLabel, getPhaseLabel } from "../lib/readingPresentation";
import { AchievementsPanel } from "../components/AchievementsPanel";
import { CharactersPanel } from "../components/CharactersPanel";
import { ExternalReaderPanel } from "../components/ExternalReaderPanel";
import { InternalPdfReaderPanel } from "../components/InternalPdfReaderPanel";
import { ManualReaderPanel } from "../components/ManualReaderPanel";
import { NarrativeContextPanel } from "../components/NarrativeContextPanel";
import { QuizPanel } from "../components/QuizPanel";
import { ReadingHeroPanel } from "../components/ReadingHeroPanel";
import { ReadingProgressPanel } from "../components/ReadingProgressPanel";
import type {
  BookDetail,
  ExternalReaderLookup,
  Favorite,
  HomeReading,
  HomeResumeResponse,
  NarrativeInsight,
  ReadingSyncResponse,
} from "../types";

export function ReadingExperiencePage() {
  const { bookId } = useParams<{ bookId: string }>();
  const headers = useAuthHeaders();
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
  const [externalReaderMessage, setExternalReaderMessage] = useState<string | null>(null);
  const [externalReaderLoading, setExternalReaderLoading] = useState(false);
  const [error, setError] = useState("");
  const [narrativeNotice, setNarrativeNotice] = useState("");

  const totalPages = Math.max(book?.numberOfPages ?? 1, 1);
  const isExternalReading = Boolean(book && !book.hasPdf && book.source === "OPEN");
  const sourceLabel = formatReadingMode(book?.hasPdf, book?.source);
  const derivedProgress = Math.round((currentPage / totalPages) * 100);
  const progressPercent = Math.max(0, Math.min(100, readingSnapshot?.progress ?? derivedProgress));
  const pagesRemaining = Math.max(totalPages - currentPage, 0);
  const phaseLabel = getPhaseLabel(insight?.phase);
  const externalSourceActionLabel =
    book?.source === "OPEN" ? "Abrir na Open Library" : "Abrir fonte externa";

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
        setError(extractApiErrorMessage(error, "Não foi possível carregar os detalhes da leitura."));
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
        setNarrativeNotice("");
      })
      .catch((error) => {
        setInsight(null);
        setSelectedOptions({});
        setRevealed({});
        setNarrativeNotice(
          extractApiErrorMessage(
            error,
            "A dinâmica narrativa ainda não está disponível para esta página. A leitura e o progresso continuam funcionando normalmente."
          )
        );
      });
  }, [bookId, headers, currentPage, book]);

  useEffect(() => {
    if (!book || book.hasPdf || book.source !== "OPEN") {
      setExternalReaderEmbedUrl(null);
      setExternalReaderFallbackUrl(null);
      setExternalReaderMessage(null);
      setExternalReaderLoading(false);
      return;
    }

    const cacheHit = readReaderCache(book);
    if (cacheHit) {
      setExternalReaderEmbedUrl(cacheHit.embedUrl);
      setExternalReaderFallbackUrl(cacheHit.fallbackUrl);
      setExternalReaderMessage(cacheHit.message ?? null);
      setExternalReaderLoading(false);
      return;
    }

    let isActive = true;

    const loadOpenLibraryReader = async () => {
      setExternalReaderLoading(true);
      try {
        const response = await api.get<ExternalReaderLookup>(`/api/v1/books/${book.id}/external-reader`);
        if (!isActive) return;

        const lookup = response.data;
        writeReaderCache(book, {
          embedUrl: lookup.embedUrl,
          fallbackUrl: lookup.fallbackUrl,
          availableInsideApp: lookup.availableInsideApp,
          message: lookup.message,
        });
        setExternalReaderEmbedUrl(lookup.embedUrl);
        setExternalReaderFallbackUrl(lookup.fallbackUrl);
        setExternalReaderMessage(lookup.message ?? null);
      } catch {
        if (!isActive) return;
        const fallbackUrl = `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`;
        const message = "Não foi possível consultar a fonte externa agora.";
        writeReaderCache(book, { embedUrl: null, fallbackUrl, message });
        setExternalReaderFallbackUrl(fallbackUrl);
        setExternalReaderMessage(message);
      } finally {
        if (isActive) setExternalReaderLoading(false);
      }
    };

    void loadOpenLibraryReader();

    return () => {
      isActive = false;
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
        { bookId, currentPage },
        { headers }
      );

      setReadingSnapshot(response.data);
      setCurrentPage(clampPage(response.data.currentPage, totalPages));
      setError("");
      showToast("Progresso de leitura salvo.", "success");
    } catch (error) {
      const message = extractApiErrorMessage(error, "Não foi possível salvar o progresso.");
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
        showToast("Livro removido da estante.", "success");
      } else {
        await api.post("/api/v1/users/me/favorites", { bookId }, { headers });
        setIsFavorite(true);
        showToast("Livro adicionado à estante.", "success");
      }
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Não foi possível atualizar sua estante."), "error");
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
        title="Livro não informado"
        message="Selecione um livro válido para abrir a experiência de leitura."
        variant="error"
        action={
          <Link to="/books" className="btn-link">
            Explorar livros
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
        title="Leitura indisponível"
        message={error || "Não foi possível carregar os detalhes da leitura."}
        variant="error"
        action={
          <Link to="/books" className="btn-link">
            Explorar livros
          </Link>
        }
      />
    );
  }

  return (
    <section className="grid aura-page aura-reading-page">
      <article className="card hero aura-hero aura-reading-intro">
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Modo de leitura</p>
            <h2>Continue sua leitura</h2>
            <p>Acompanhe seu progresso e retome a leitura de onde parou.</p>
          </div>
          <div className="aura-hero__signal">
            <BookOpenCheck aria-hidden="true" />
            <strong>{progressPercent}%</strong>
            <span>lido</span>
          </div>
        </div>
      </article>

      <ReadingHeroPanel
        book={book}
        currentPage={currentPage}
        totalPages={totalPages}
        pagesRemaining={pagesRemaining}
        progressPercent={progressPercent}
        phaseLabel={phaseLabel}
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

      {book.hasPdf ? (
        <InternalPdfReaderPanel
          bookTitle={book.title}
          internalPdfUrl={internalPdfUrl}
          currentPage={currentPage}
          saving={saving}
          onSyncReading={syncReading}
        />
      ) : null}

      {!book.hasPdf && book.source === "OPEN" ? (
        <ExternalReaderPanel
          book={book}
          sourceLabel={sourceLabel}
          externalReaderLoading={externalReaderLoading}
          externalReaderEmbedUrl={externalReaderEmbedUrl}
          externalReaderFallbackUrl={externalReaderFallbackUrl}
          externalSourceActionLabel={externalSourceActionLabel}
          externalReaderMessage={externalReaderMessage}
          saving={saving}
          onSyncReading={syncReading}
        />
      ) : null}

      {!book.hasPdf && book.source !== "OPEN" ? (
        <ManualReaderPanel bookTitle={book.title} saving={saving} onSyncReading={syncReading} />
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

      {narrativeNotice ? <article className="card info">{narrativeNotice}</article> : null}
      {error ? <article className="card error">{error}</article> : null}
    </section>
  );
}
