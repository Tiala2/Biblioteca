import { BookOpen, ExternalLink, Heart, Library, MessageCircle, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { BookCover } from "@shared/ui/books/BookCover";
import { formatReadingMode } from "@shared/lib/presentation";
import type { BookDetail } from "../types";
import { humanizeNarrativeText } from "../lib/readingPresentation";

type ReadingHeroPanelProps = {
  book: BookDetail;
  currentPage: number;
  totalPages: number;
  pagesRemaining: number;
  progressPercent: number;
  phaseLabel: string;
  readingStatusLabel: string;
  isExternalReading: boolean;
  plotState?: string | null;
  saving: boolean;
  isFavorite: boolean;
  favoriteLoading: boolean;
  internalPdfUrl: string | null;
  externalReaderFallbackUrl: string | null;
  onSyncReading: () => void;
  onToggleFavorite: () => void;
};

export function ReadingHeroPanel({
  book,
  currentPage,
  totalPages,
  pagesRemaining,
  progressPercent,
  phaseLabel,
  readingStatusLabel,
  isExternalReading,
  plotState,
  saving,
  isFavorite,
  favoriteLoading,
  internalPdfUrl,
  externalReaderFallbackUrl,
  onSyncReading,
  onToggleFavorite,
}: ReadingHeroPanelProps) {
  const readingModeLabel = formatReadingMode(book.hasPdf, book.source);
  const internalReaderUrl = internalPdfUrl ? `${internalPdfUrl}#page=${currentPage}` : null;
  const estimatedMinutes = Math.max(1, Math.ceil(pagesRemaining * 2));
  const estimatedReadingTimeLabel =
    estimatedMinutes >= 60 ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}min` : `${estimatedMinutes}min`;
  const description = book.hasPdf
    ? book.source === "GUTENBERG"
      ? "Leia, salve seu progresso e continue de onde parou."
      : "Leia, salve seu progresso e continue de onde parou."
    : book.source === "OPEN"
      ? "Leia na fonte oficial e registre aqui a página atual para manter metas, classificação e continuidade da leitura."
      : "Registre manualmente a página atual enquanto o PDF local não está disponível no app.";

  return (
    <article className="card hero aura-hero aura-book-detail-hero aura-reading-focus">
      <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="large" />
      <div className="section-head">
        <div>
          <h2>{book.title}</h2>
          <p>{description}</p>
        </div>
        <div className="reading-mode-stack">
          <span className="kpi reader-source-badge">{readingModeLabel}</span>
          <span className="kpi">{progressPercent}% lido</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <strong>{currentPage}</strong>
          <span>Página atual</span>
        </div>
        <div className="stat-box">
          <strong>{totalPages}</strong>
          <span>Total de páginas</span>
        </div>
        <div className="stat-box">
          <strong>{pagesRemaining}</strong>
          <span>Páginas restantes</span>
        </div>
        <div className="stat-box">
          <strong>{estimatedReadingTimeLabel}</strong>
          <span>Tempo estimado</span>
        </div>
        <div className="stat-box">
          <strong>{phaseLabel}</strong>
          <span>Trecho atual</span>
        </div>
        <div className="stat-box">
          <strong>{readingStatusLabel}</strong>
          <span>Status</span>
        </div>
      </div>

      <p className="quote">
        {plotState
          ? `Trecho atual: ${humanizeNarrativeText(plotState)}`
          : "Acompanhe sua narrativa por trecho lido."}
      </p>

      <div className="card-actions reading-focus-actions">
        {book.hasPdf && internalReaderUrl ? (
          <a className="btn-link" href={internalReaderUrl} target="_blank" rel="noreferrer">
            <BookOpen aria-hidden="true" />
            Abrir leitura
          </a>
        ) : null}
        {isExternalReading && externalReaderFallbackUrl ? (
          <a className="btn-link" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            Abrir fonte externa
          </a>
        ) : null}
        <button
          type="button"
          className="btn-muted"
          aria-label="Salvar progresso pelo resumo da leitura"
          onClick={onSyncReading}
          disabled={saving}
        >
          <Save aria-hidden="true" />
          {saving ? "Salvando..." : "Salvar progresso"}
        </button>
        <button
          type="button"
          className={isFavorite ? "favorite-toggle active" : "favorite-toggle"}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
        >
          <Heart aria-hidden="true" />
          {favoriteLoading ? "Salvando..." : isFavorite ? "Na estante" : "Adicionar à estante"}
        </button>
        <Link to={`/reviews?bookId=${book.id}&action=create`} className="btn-muted btn-link" aria-label="Avaliar livro">
          <MessageCircle aria-hidden="true" />
          Avaliar livro
        </Link>
        <Link to={`/books/${book.id}`} className="btn-muted btn-link">
          <Library aria-hidden="true" />
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
