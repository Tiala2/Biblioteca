import { ChevronsLeft, ChevronsRight, CornerDownLeft, CornerDownRight } from "lucide-react";
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

function ReadingDateValue({ value }: { value?: string | null }) {
  const label = formatDateLabel(value);
  const [date, time] = label.split(", ");

  if (!time) {
    return <strong>{label}</strong>;
  }

  return (
    <strong className="reading-date-value" aria-label={label}>
      <span>{date}</span>
      <span>{time}</span>
    </strong>
  );
}

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
          <h3>Seu progresso</h3>
          <p className="section-sub">
            Atualize sua página atual e salve seu avanço.
          </p>
        </div>
        <span className="kpi">Fase: {phaseLabel}</span>
      </div>

      {!hasPdf ? (
        <p className="section-sub">
          Mesmo sem leitura integrada, você pode informar manualmente a página atual. Assim o livro continua contando em metas,
          histórico e engajamento.
        </p>
      ) : null}

      <div className="stats-grid">
        <div className="stat-box">
          <strong>{readingSnapshot?.currentPage ?? currentPage}</strong>
          <span>Última página salva</span>
        </div>
        <div className="stat-box">
          <ReadingDateValue value={readingSnapshot?.lastReadedAt} />
          <span>Última atualização</span>
        </div>
        <div className="stat-box">
          <ReadingDateValue value={readingSnapshot?.startedAt} />
          <span>Início da leitura</span>
        </div>
        <div className="stat-box">
          <ReadingDateValue value={readingSnapshot?.finishedAt} />
          <span>{readingSnapshot?.finishedAt ? "Conclusão" : "Ainda sem conclusão"}</span>
        </div>
      </div>

      <div
        className="progress-track aura-progress"
        role="progressbar"
        aria-label="Progresso de leitura"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-valuetext={`${progressPercent}% lido`}
      >
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="reading-control-row">
        <div>
          <label htmlFor="reading-range">Atualizar página atual</label>
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
          <label htmlFor="reading-page-input">Página atual</label>
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
        <button type="button" className="btn-muted" aria-label="Ir para o início do livro" onClick={() => onUpdateCurrentPage(1)}>
          <CornerDownLeft aria-hidden="true" />
          Início
        </button>
        <button type="button" className="btn-muted" aria-label="Voltar 10 páginas" onClick={() => onJumpPages(-10)}>
          <ChevronsLeft aria-hidden="true" />
          -10 páginas
        </button>
        <button type="button" className="btn-muted" aria-label="Avançar 10 páginas" onClick={() => onJumpPages(10)}>
          <ChevronsRight aria-hidden="true" />
          +10 páginas
        </button>
        <button type="button" className="btn-muted" aria-label="Ir para o final do livro" onClick={() => onUpdateCurrentPage(totalPages)}>
          <CornerDownRight aria-hidden="true" />
          Final
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
