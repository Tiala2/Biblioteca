import { Download, ExternalLink, Save } from "lucide-react";

type InternalPdfReaderPanelProps = {
  bookTitle: string;
  internalPdfUrl: string | null;
  saving: boolean;
  onSyncReading: () => void;
};

export function InternalPdfReaderPanel({
  bookTitle,
  internalPdfUrl,
  saving,
  onSyncReading,
}: InternalPdfReaderPanelProps) {
  return (
    <article className="card reader-panel reader-panel--internal">
      <div className="section-head">
        <div>
          <p className="eyebrow">Modo leitura</p>
          <h3>Leitor do acervo interno</h3>
          <p className="section-sub">
            Leia o PDF no app, ajuste a página no painel de progresso e salve quando quiser atualizar metas, ranking e
            histórico.
          </p>
        </div>
        <span className="kpi reader-source-badge reader-source-badge--local">PDF no app</span>
      </div>

      {internalPdfUrl ? (
        <>
          <div className="reader-toolbar" aria-label="Ações do leitor interno">
            <button type="button" onClick={onSyncReading} disabled={saving}>
              <Save aria-hidden="true" />
              {saving ? "Salvando..." : "Salvar página atual"}
            </button>
            <a className="btn-muted btn-link" href={internalPdfUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" />
              Abrir em nova aba
            </a>
            <a className="btn-muted btn-link" href={`${internalPdfUrl}?download=true`}>
              <Download aria-hidden="true" />
              Baixar PDF
            </a>
          </div>

          <div className="external-reader-wrap reader-frame-wrap">
            <iframe
              title={`Leitor PDF - ${bookTitle}`}
              src={internalPdfUrl}
              className="external-reader-frame"
              loading="lazy"
            />
          </div>
        </>
      ) : (
        <div className="reader-unavailable" role="status">
          <h4>PDF ainda indisponível</h4>
          <p className="section-sub">
            Este livro está marcado para leitura no app, mas o arquivo ainda está sendo preparado. Tente novamente em
            instantes.
          </p>
        </div>
      )}
    </article>
  );
}
