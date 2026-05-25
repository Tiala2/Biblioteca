import { formatDateLabel, humanizeNarrativeText } from "../lib/readingPresentation";
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
    <article className="card aura-panel aura-panel--focus reading-progress-panel">
      <div className="section-head">
        <div>
          <h3>Painel de progresso</h3>
          <p className="section-sub">
            Ajuste a página atual e registre o que foi lido para refletir metas, ranking e conquistas.
          </p>
        </div>
        <span className="kpi">Fase: {phaseLabel}</span>
      </div>

      {!hasPdf ? (
        <p className="section-sub">
          Mesmo sem leitura interna, você pode informar manualmente a página atual. Assim o livro continua contando em metas,
          histórico e engajamento.
        </p>
      ) : null}

      <div className="stats-grid">
        <div className="stat-box">
          <strong>{readingSnapshot?.currentPage ?? currentPage}</strong>
          <span>última página salva</span>
        </div>
        <div className="stat-box">
          <strong>{formatDateLabel(readingSnapshot?.lastReadedAt)}</strong>
          <span>última sincronização</span>
        </div>
        <div className="stat-box">
          <strong>{formatDateLabel(readingSnapshot?.startedAt)}</strong>
          <span>início da leitura</span>
        </div>
        <div className="stat-box">
          <strong>{formatDateLabel(readingSnapshot?.finishedAt)}</strong>
          <span>conclusão</span>
        </div>
      </div>

      <div
        className="progress-track aura-progress"
        role="progressbar"
        aria-label="Progresso de leitura"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-valuetext={`${progressPercent}% concluído`}
      >
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="reading-control-row">
        <div>
          <label htmlFor="reading-range">Selecione a página lida</label>
          <input
            id="reading-range"
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            aria-valuetext={`Página ${currentPage} de ${totalPages}`}
            onChange={(event) => onUpdateCurrentPage(Number(event.target.value))}
          />
        </div>

        <div className="reading-page-box">
          <label htmlFor="reading-page-input">Página</label>
          <input
            id="reading-page-input"
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            aria-label={`Página atual de ${totalPages}`}
            onChange={(event) => onUpdateCurrentPage(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="page-jump-grid">
        <button type="button" className="btn-muted" onClick={() => onUpdateCurrentPage(1)}>
          Ir para início
        </button>
        <button type="button" className="btn-muted" onClick={() => onJumpPages(-10)}>
          Voltar 10 páginas
        </button>
        <button type="button" className="btn-muted" onClick={() => onJumpPages(10)}>
          Avançar 10 páginas
        </button>
        <button type="button" className="btn-muted" onClick={() => onUpdateCurrentPage(totalPages)}>
          Ir para final
        </button>
      </div>

      <p className="section-sub">
        Trecho atual:{" "}
        {insight?.beatTitle
          ? humanizeNarrativeText(insight.beatTitle)
          : "A curadoria narrativa ainda não chegou a esta página."}
      </p>
    </article>
  );
}
