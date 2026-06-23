import { Download, ExternalLink, Save } from "lucide-react";

type InternalPdfReaderPanelProps = {
  bookTitle: string;
  internalPdfUrl: string | null;
  currentPage: number;
  saving: boolean;
  onSyncReading: () => void;
};

export function InternalPdfReaderPanel({
  bookTitle,
  internalPdfUrl,
  currentPage,
  saving,
  onSyncReading,
}: InternalPdfReaderPanelProps) {
  const readerUrl = internalPdfUrl ? `${internalPdfUrl}#page=${currentPage}` : null;

  return (
    <article className="card reader-panel reader-panel--internal">
      <div className="section-head">
        <div>
          <p className="eyebrow">Modo leitura</p>
          <h3>Leitura integrada</h3>
          <p className="section-sub">
            Leia o PDF, atualize a página atual e salve seu progresso.
          </p>
        </div>
        <span className="kpi reader-source-badge reader-source-badge--local">PDF disponível</span>
      </div>

      {internalPdfUrl ? (
        <>
          <div className="reader-toolbar" aria-label="Ações do leitor interno">
            <a className="btn-link" href={readerUrl ?? internalPdfUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" />
              Abrir leitura
            </a>
            <button
              type="button"
              className="btn-muted"
              aria-label="Salvar progresso"
              onClick={onSyncReading}
              disabled={saving}
            >
              <Save aria-hidden="true" />
              {saving ? "Salvando..." : "Salvar progresso"}
            </button>
            <a className="btn-muted btn-link" href={`${internalPdfUrl}?download=true`}>
              <Download aria-hidden="true" />
              Baixar PDF
            </a>
          </div>

          <div className="external-reader-wrap reader-frame-wrap">
            <iframe
              title={`Leitor PDF - ${bookTitle}`}
              src={readerUrl ?? internalPdfUrl}
              className="external-reader-frame"
              loading="lazy"
            />
          </div>
        </>
      ) : (
        <div className="reader-unavailable" role="status">
          <h4>Arquivo de leitura indisponível</h4>
          <p className="section-sub">
            Este livro está marcado para leitura no app, mas o arquivo ainda está sendo preparado. Tente novamente em
            instantes.
          </p>
        </div>
      )}
    </article>
  );
}
