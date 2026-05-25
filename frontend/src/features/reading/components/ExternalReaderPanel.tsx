import type { BookDetail } from "../types";

type ExternalReaderPanelProps = {
  book: BookDetail;
  sourceLabel: string;
  externalReaderLoading: boolean;
  externalReaderEmbedUrl: string | null;
  externalReaderFallbackUrl: string | null;
  externalSourceActionLabel: string;
  externalReaderMessage?: string | null;
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
  externalReaderMessage,
  saving,
  onSyncReading,
}: ExternalReaderPanelProps) {
  const hasEmbeddedReader = Boolean(externalReaderEmbedUrl);
  const sourceBadgeLabel =
    book.source === "OPEN"
      ? hasEmbeddedReader
        ? "Open Library integrado"
        : "Open Library externo"
      : hasEmbeddedReader
        ? "Fonte integrada"
        : "Fonte externa";

  return (
    <article className="card reader-panel reader-panel--external">
      <div className="section-head">
        <div>
          <p className="eyebrow">Modo leitura</p>
          <h3>{hasEmbeddedReader ? "Leitura online integrada" : "Leitura na fonte oficial"}</h3>
          <p className="section-sub">
            {hasEmbeddedReader
              ? "A fonte permite leitura incorporada. Você pode ler aqui e salvar a página atual no mesmo fluxo."
              : "Este livro não permite leitura incorporada aqui. Abra a fonte oficial em nova aba e volte para salvar seu progresso."}
          </p>
        </div>
        <span className="kpi reader-source-badge reader-source-badge--external">{sourceBadgeLabel}</span>
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
          {externalReaderMessage ??
            "Quando a fonte oficial permite incorporação, abrimos o leitor aqui dentro. Quando não permite, você continua na fonte autorizada e mantém metas, ranking, histórico e favoritos no Library."}
        </p>

        <div className="external-reading-steps" aria-label="Como usar leitura externa">
          <div className="external-step">
            <strong>1</strong>
            <span>{hasEmbeddedReader ? "Leia no leitor incorporado." : "Abra a fonte oficial em nova aba."}</span>
          </div>
          <div className="external-step">
            <strong>2</strong>
            <span>Anote a página em que parou.</span>
          </div>
          <div className="external-step">
            <strong>3</strong>
            <span>Volte ao Library e salve a página atual.</span>
          </div>
        </div>

        {externalReaderFallbackUrl ? (
          <div className="card-actions external-reading-actions">
            <a className="btn-link external-reading-primary" href={externalReaderFallbackUrl} target="_blank" rel="noreferrer">
              {externalSourceActionLabel}
            </a>
            <button type="button" className="btn-muted" onClick={onSyncReading} disabled={saving}>
              {saving ? "Salvando..." : "Salvar página atual"}
            </button>
          </div>
        ) : null}
      </div>

      {externalReaderLoading ? <p className="section-sub">Preparando leitor online...</p> : null}

      {!externalReaderLoading && externalReaderEmbedUrl ? (
        <div className="external-reader-wrap reader-frame-wrap">
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
        <div className="reader-unavailable" role="status">
          <h4>Leitura fora do app</h4>
          <p className="section-sub">
            Não encontramos uma versão incorporável deste livro. Use o botão principal para continuar na fonte oficial e
            depois salve a página atual aqui.
          </p>
        </div>
      ) : null}
    </article>
  );
}
