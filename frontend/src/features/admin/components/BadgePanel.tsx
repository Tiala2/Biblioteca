import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BADGE_CODES, BADGE_CRITERIA, type Badge, type BadgeCode, type BadgeCriteria, type BadgeForm } from "../types";

type BadgePanelProps = {
  form: BadgeForm;
  badges: Badge[];
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: BadgeForm) => BadgeForm) => void;
  onEdit: (badge: Badge) => void;
  onReset: () => void;
  onDelete: (badgeId: string) => void;
};

export function BadgePanel({ form, badges, busyKey, onSubmit, onFormChange, onEdit, onReset, onDelete }: BadgePanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBadges = useMemo(() => {
    if (!normalizedSearch) return badges;
    return badges.filter((badge) =>
      `${badge.name} ${badge.code} ${badge.criteriaType} ${badge.criteriaValue ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [badges, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / pageSize));
  const visibleBadges = filteredBadges.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-badges" className="card admin-panel">
      <h3>{form.id ? "Editar badge" : "Novo badge"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <select value={form.code} onChange={(event) => onFormChange((prev) => ({ ...prev, code: event.target.value as BadgeCode }))}>
          {BADGE_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input value={form.name} onChange={(event) => onFormChange((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nome" required />
        <input
          value={form.description}
          onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Descricao"
        />
        <select value={form.criteriaType} onChange={(event) => onFormChange((prev) => ({ ...prev, criteriaType: event.target.value as BadgeCriteria }))}>
          {BADGE_CRITERIA.map((criteria) => (
            <option key={criteria} value={criteria}>
              {criteria}
            </option>
          ))}
        </select>
        <input
          value={form.criteriaValue}
          onChange={(event) => onFormChange((prev) => ({ ...prev, criteriaValue: event.target.value }))}
          placeholder="Valor"
        />
        <label className="check-inline">
          <input type="checkbox" checked={form.active} onChange={(event) => onFormChange((prev) => ({ ...prev, active: event.target.checked }))} /> Ativo
        </label>
        <button type="submit" disabled={busyKey === "badge-create" || busyKey === `badge-save-${form.id}`}>
          {form.id ? "Salvar badge" : "Criar badge"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Lista de badges</h4>
        <span className="kpi">{filteredBadges.length}</span>
      </div>
      <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Filtrar badges" />
      <ul className="stacked-list">
        {visibleBadges.map((badge) => (
          <li key={badge.id} className="stacked-list-item">
            <div>
              <strong>{badge.name}</strong>
              <p className="section-sub">
                {badge.code} | {badge.criteriaType} | {badge.criteriaValue ?? "sem valor"}
              </p>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(badge)}>
                Editar
              </button>
              <button type="button" className="btn-muted" disabled={busyKey === `badge-delete-${badge.id}`} onClick={() => onDelete(badge.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredBadges.length === 0 && <p className="section-sub">Nenhum badge encontrado para esse filtro.</p>}
      {filteredBadges.length > pageSize && (
        <div className="pagination-row">
          <button type="button" className="btn-muted" disabled={page <= 0} onClick={() => setPage((previous) => Math.max(0, previous - 1))}>
            Anterior
          </button>
          <span className="section-sub">Pagina {page + 1} de {totalPages}</span>
          <button type="button" className="btn-muted" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}>
            Proxima
          </button>
        </div>
      )}
    </article>
  );
}
