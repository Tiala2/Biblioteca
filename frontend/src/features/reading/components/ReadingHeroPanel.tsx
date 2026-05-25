import { Link } from "react-router-dom";
import { BookCover } from "@shared/ui/books/BookCover";
import type { BookDetail } from "../types";

type ReadingHeroPanelProps = {
  book: BookDetail;
  currentPage: number;
  totalPages: number;
  pagesRemaining: number;
  progressPercent: number;
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
  const readingModeLabel = book.hasPdf
    ? "PDF no app"
    : book.source === "OPEN"
      ? "Open Library"
      : "Progresso manual";
  const description = book.hasPdf
    ? "Leia no app, acompanhe a fase narrativa e salve o progresso sem sair da experiência."
    : book.source === "OPEN"
      ? "Leia na fonte oficial e registre aqui a página atual para manter metas, ranking e continuidade da leitura."
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
          <span className="kpi">{progressPercent}% concluído</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <strong>{currentPage}</strong>
          <span>página atual</span>
        </div>
        <div className="stat-box">
          <strong>{totalPages}</strong>
          <span>páginas totais</span>
        </div>
        <div className="stat-box">
          <strong>{pagesRemaining}</strong>
          <span>páginas restantes</span>
        </div>
        <div className="stat-box">
          <strong>{readingStatusLabel}</strong>
          <span>status da leitura</span>
        </div>
      </div>

      <p className="quote">{plotState ?? "Acompanhe sua narrativa por trecho lido."}</p>

      <div className="card-actions">
        <button type="button" onClick={onSyncReading} disabled={saving}>
          {saving ? "Salvando..." : "Salvar progresso"}
        </button>
        <button
          type="button"
          className={isFavorite ? "favorite-toggle active" : "favorite-toggle"}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? "Salvando..." : isFavorite ? "Nos favoritos" : "Salvar nos favoritos"}
        </button>
        <Link to="/books" className="btn-link">
          Voltar ao catálogo
        </Link>
        {book.hasPdf && internalPdfUrl ? (
          <a className="btn-link" href={internalPdfUrl} target="_blank" rel="noreferrer">
            Abrir leitor
          </a>
        ) : null}
        {isExternalReading && externalReaderFallbackUrl ? (
          <a className="btn-link" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
            Abrir fonte externa
          </a>
        ) : null}
      </div>
    </article>
  );
}
