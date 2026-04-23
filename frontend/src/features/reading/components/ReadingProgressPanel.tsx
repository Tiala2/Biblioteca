import { formatDateLabel } from "../lib/readingPresentation";
import type { HomeReading, NarrativeInsight, ReadingSyncResponse } from "../types";

type ReadingProgressPanelProps = {
  hasPdf: boolean;
  phaseLabel: string;
  readingSnapshot: HomeReading | ReadingSyncResponse | null;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  insight: NarrativeInsight | null;
  onUpdateCurrentPage: (value: number) => void;
  onJumpPages: (delta: number) => void;
};

export function ReadingProgressPanel({
  hasPdf,
  phaseLabel,
  readingSnapshot,
  currentPage,
  totalPages,
  progressPercent,
  insight,
  onUpdateCurrentPage,
  onJumpPages,
}: ReadingProgressPanelProps) {
  return (
    <article className="card">
      <div className="section-head">
        <div>
          <h3>Painel de progresso</h3>
          <p className="section-sub">
            Ajuste a pagina atual e registre o que foi lido para refletir metas, ranking e badges.
          </p>
        </div>
        <span className="kpi">Fase: {phaseLabel}</span>
      </div>

      {!hasPdf ? (
        <p className="section-sub">
          Mesmo sem PDF local, voce pode informar manualmente a pagina atual. Assim o livro continua contando em metas,
          historico e engajamento.
        </p>
      ) : null}

      <div className="stats-grid">
        <div className="stat-box">
          <strong>{readingSnapshot?.currentPage ?? currentPage}</strong>
          <span>ultima pagina salva</span>
        </div>
        <div className="stat-box">
          <strong>{formatDateLabel(readingSnapshot?.lastReadedAt)}</strong>
          <span>ultima sincronizacao</span>
        </div>
        <div className="stat-box">
          <strong>{formatDateLabel(readingSnapshot?.startedAt)}</strong>
          <span>inicio da leitura</span>
        </div>
        <div className="stat-box">
          <strong>{formatDateLabel(readingSnapshot?.finishedAt)}</strong>
          <span>conclusao</span>
        </div>
      </div>

      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="reading-control-row">
        <div>
          <label htmlFor="reading-range">Selecione a pagina lida</label>
          <input
            id="reading-range"
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(event) => onUpdateCurrentPage(Number(event.target.value))}
          />
        </div>

        <div className="reading-page-box">
          <label htmlFor="reading-page-input">Pagina</label>
          <input
            id="reading-page-input"
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(event) => onUpdateCurrentPage(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="page-jump-grid">
        <button type="button" className="btn-muted" onClick={() => onUpdateCurrentPage(1)}>
          Ir para inicio
        </button>
        <button type="button" className="btn-muted" onClick={() => onJumpPages(-10)}>
          Voltar 10 pags
        </button>
        <button type="button" className="btn-muted" onClick={() => onJumpPages(10)}>
          Avancar 10 pags
        </button>
        <button type="button" className="btn-muted" onClick={() => onUpdateCurrentPage(totalPages)}>
          Ir para final
        </button>
      </div>

      <p className="section-sub">Beat atual: {insight?.beatTitle ?? "Sem beat definido para a pagina selecionada."}</p>
    </article>
  );
}
