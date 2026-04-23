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
  return (
    <article className="card hero">
      <BookCover title={book.title} coverUrl={book.coverUrl} size="large" />
      <div className="section-head">
        <div>
          <h2>{book.title}</h2>
          <p>
            {isExternalReading
              ? "Leia na fonte externa e registre aqui a pagina atual para manter metas, ranking e continuidade da leitura."
              : "Retome sua leitura, acompanhe a fase narrativa e salve o progresso sem sair da experiencia."}
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
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? "Salvando..." : isFavorite ? "Nos favoritos" : "Salvar nos favoritos"}
        </button>
        <Link to="/books" className="btn-link">
          Voltar ao catalogo
        </Link>
        {book.hasPdf && internalPdfUrl ? (
          <a className="btn-link" href={internalPdfUrl} target="_blank" rel="noreferrer">
            Abrir leitor
          </a>
        ) : null}
        {!book.hasPdf && externalReaderFallbackUrl ? (
          <a className="btn-link" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
            Abrir fonte externa
          </a>
        ) : null}
      </div>
    </article>
  );
}
