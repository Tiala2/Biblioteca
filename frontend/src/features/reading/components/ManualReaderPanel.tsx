import { Save } from "lucide-react";

type ManualReaderPanelProps = {
  bookTitle: string;
  saving: boolean;
  onSyncReading: () => void;
};

export function ManualReaderPanel({ bookTitle, saving, onSyncReading }: ManualReaderPanelProps) {
  return (
    <article className="card reader-panel reader-panel--manual">
      <div className="section-head">
        <div>
          <p className="eyebrow">Modo leitura</p>
          <h3>Leitura manual do acervo</h3>
          <p className="section-sub">
            Este livro está no acervo local, mas o PDF ainda não está disponível no app. Use o painel de progresso para
            registrar a página em que parou.
          </p>
        </div>
        <span className="kpi reader-source-badge reader-source-badge--manual">Atualização manual</span>
      </div>

      <div className="reader-unavailable" role="status">
        <h4>PDF ainda não cadastrado</h4>
        <p className="section-sub">
          Enquanto o arquivo de {bookTitle} não estiver no acervo digital, a leitura continua contando para metas,
          histórico, classificação e conquistas pelo registro manual da página.
        </p>
      </div>

      <div className="reader-toolbar" aria-label="Ações da leitura manual">
        <button type="button" onClick={onSyncReading} disabled={saving}>
          <Save aria-hidden="true" />
          {saving ? "Salvando..." : "Salvar progresso"}
        </button>
      </div>
    </article>
  );
}
