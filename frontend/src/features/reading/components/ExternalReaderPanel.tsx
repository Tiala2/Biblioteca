import type { BookDetail } from "../types";

type ExternalReaderPanelProps = {
  book: BookDetail;
  sourceLabel: string;
  externalReaderLoading: boolean;
  externalReaderEmbedUrl: string | null;
  externalReaderFallbackUrl: string | null;
  externalSourceActionLabel: string;
  saving: boolean;
  onSyncReading: () => void;
};

export function ExternalReaderPanel({
  book,
  sourceLabel,
  externalReaderLoading,
  externalReaderEmbedUrl,
  externalReaderFallbackUrl,
  externalSourceActionLabel,
  saving,
  onSyncReading,
}: ExternalReaderPanelProps) {
  return (
    <article className="card">
      <div className="section-head">
        <h3>Leitura online</h3>
        <span className="kpi">{sourceLabel}</span>
      </div>
      <div className="external-reading-panel">
        <div className="external-reading-panel__head">
          <div>
            <p className="eyebrow">Leitura externa guiada</p>
            <h4>Continue a leitura sem perder seu progresso</h4>
          </div>
          <span className="external-source-pill">{sourceLabel}</span>
        </div>
        <p className="section-sub">
          Este livro e acessado em fonte externa. Leia no provedor oficial e volte aqui para registrar a pagina atual,
          mantendo metas, ranking, historico e favoritos no mesmo fluxo.
        </p>
        <div className="external-reading-steps" aria-label="Como usar leitura externa">
          <div className="external-step">
            <strong>1</strong>
            <span>Abra o livro na fonte oficial.</span>
          </div>
          <div className="external-step">
            <strong>2</strong>
            <span>Leia normalmente fora da plataforma.</span>
          </div>
          <div className="external-step">
            <strong>3</strong>
            <span>Volte e salve a pagina lida aqui.</span>
          </div>
        </div>
        {externalReaderFallbackUrl ? (
          <div className="card-actions external-reading-actions">
            <a className="btn-link external-reading-primary" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
              {externalSourceActionLabel}
            </a>
            <button type="button" className="btn-muted" onClick={onSyncReading} disabled={saving}>
              {saving ? "Salvando..." : "Salvar pagina atual"}
            </button>
          </div>
        ) : null}
      </div>
      {externalReaderLoading ? <p className="section-sub">Preparando leitor online...</p> : null}
      {!externalReaderLoading && externalReaderEmbedUrl ? (
        <div className="external-reader-wrap">
          <iframe
            title={`Leitor online - ${book.title}`}
            src={externalReaderEmbedUrl}
            className="external-reader-frame"
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) : null}
      {!externalReaderLoading && !externalReaderEmbedUrl ? (
        <p className="section-sub">
          Nao encontramos uma versao incorporavel deste livro. Use o link oficial para continuar a leitura fora da plataforma.
        </p>
      ) : null}
      {externalReaderFallbackUrl ? (
        <div className="card-actions">
          <a className="btn-link btn-muted" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
            {book.source === "OPEN" ? "Abrir fonte alternativa" : "Abrir fonte externa"}
          </a>
        </div>
      ) : null}
    </article>
  );
}
