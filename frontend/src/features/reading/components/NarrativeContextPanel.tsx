type NarrativeContextPanelProps = {
  phaseLabel: string;
  plotState?: string | null;
};

export function NarrativeContextPanel({ phaseLabel, plotState }: NarrativeContextPanelProps) {
  return (
    <article className="card">
      <div className="section-head">
        <h3>Contexto narrativo</h3>
        <span className="kpi">{phaseLabel}</span>
      </div>
      <p>{plotState ?? "Sem resumo narrativo disponivel para este trecho."}</p>
    </article>
  );
}
