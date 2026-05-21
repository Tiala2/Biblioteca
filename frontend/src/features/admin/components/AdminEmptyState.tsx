type AdminEmptyStateProps = {
  title: string;
  message?: string;
};

export function AdminEmptyState({
  title,
  message = "Ajuste os filtros ou cadastre novos itens para preencher esta lista.",
}: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state" role="status" aria-live="polite">
      <p className="eyebrow">Nada por enquanto</p>
      <h3>{title}</h3>
      <p className="section-sub">{message}</p>
    </div>
  );
}
