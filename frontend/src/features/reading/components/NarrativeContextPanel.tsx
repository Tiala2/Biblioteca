import { humanizeNarrativeText } from "../lib/readingPresentation";

type NarrativeContextPanelProps = {
  phaseLabel: string;
  plotState?: string | null;
};

export function NarrativeContextPanel({ phaseLabel, plotState }: NarrativeContextPanelProps) {
  return (
    <article className="card narrative-panel">
      <div className="section-head">
        <h3>Contexto narrativo</h3>
        <span className="kpi">{phaseLabel}</span>
      </div>
      {plotState ? (
        <p>{humanizeNarrativeText(plotState)}</p>
      ) : (
        <div className="panel-inline-state narrative-empty" role="status">
          <p className="eyebrow">Resumo em preparação</p>
          <h3>Este trecho ainda não tem contexto guiado</h3>
          <p className="section-sub">
            Você pode continuar lendo e salvando progresso; a experiência narrativa aparece quando o livro recebe curadoria.
          </p>
        </div>
      )}
    </article>
  );
}
