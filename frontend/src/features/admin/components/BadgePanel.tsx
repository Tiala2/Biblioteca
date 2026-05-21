import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BADGE_CODES, BADGE_CRITERIA, type Badge, type BadgeCode, type BadgeCriteria, type BadgeForm } from "../types";
import { formatBadgeCode, formatBadgeCriteria } from "../lib/labels";
import { AdminEmptyState } from "./AdminEmptyState";

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

function getMostUsedCriteria(badges: Badge[]) {
  const counts = badges.reduce<Record<string, number>>((accumulator, badge) => {
    accumulator[badge.criteriaType] = (accumulator[badge.criteriaType] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).sort(([, first], [, second]) => second - first)[0]?.[0] ?? "-";
}

export function BadgePanel({ form, badges, busyKey, onSubmit, onFormChange, onEdit, onReset, onDelete }: BadgePanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBadges = useMemo(() => {
    if (!normalizedSearch) return badges;
    return badges.filter((badge) =>
      `${badge.name} ${badge.code} ${badge.criteriaType} ${badge.criteriaValue ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [badges, normalizedSearch]);
  const badgeInsights = useMemo(() => {
    const activeCount = badges.filter((badge) => badge.active).length;
    const inactiveCount = badges.length - activeCount;

    return {
      activeCount,
      inactiveCount,
      mostUsedCriteria: getMostUsedCriteria(badges),
    };
  }, [badges]);
  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / pageSize));
  const visibleBadges = filteredBadges.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-badges" className="card admin-panel">
      <h3>{form.id ? "Editar conquista" : "Nova conquista"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <select
          aria-label="Código da conquista"
          value={form.code}
          onChange={(event) => onFormChange((prev) => ({ ...prev, code: event.target.value as BadgeCode }))}
        >
          {BADGE_CODES.map((code) => (
            <option key={code} value={code}>
              {formatBadgeCode(code)}
            </option>
          ))}
        </select>
        <input
          aria-label="Nome da conquista"
          value={form.name}
          onChange={(event) => onFormChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Nome"
          required
        />
        <input
          aria-label="Descrição da conquista"
          value={form.description}
          onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Descrição"
        />
        <select
          aria-label="Critério da conquista"
          value={form.criteriaType}
          onChange={(event) => onFormChange((prev) => ({ ...prev, criteriaType: event.target.value as BadgeCriteria }))}
        >
          {BADGE_CRITERIA.map((criteria) => (
            <option key={criteria} value={criteria}>
              {formatBadgeCriteria(criteria)}
            </option>
          ))}
        </select>
        <input
          aria-label="Valor do critério"
          value={form.criteriaValue}
          onChange={(event) => onFormChange((prev) => ({ ...prev, criteriaValue: event.target.value }))}
          placeholder="Valor"
        />
        <label className="check-inline">
          <input type="checkbox" checked={form.active} onChange={(event) => onFormChange((prev) => ({ ...prev, active: event.target.checked }))} /> Ativo
        </label>
        <button type="submit" disabled={busyKey === "badge-create" || busyKey === `badge-save-${form.id}`}>
          {form.id ? "Salvar conquista" : "Criar conquista"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Lista de conquistas</h4>
        <span className="kpi">{filteredBadges.length}</span>
      </div>
      <div className="admin-badge-summary">
        <div className="stat-box admin-list-stat">
          <strong>{badgeInsights.activeCount}</strong>
          <span>conquistas ativas</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{badgeInsights.inactiveCount}</strong>
          <span>inativas</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{badgeInsights.mostUsedCriteria === "-" ? "-" : formatBadgeCriteria(badgeInsights.mostUsedCriteria as BadgeCriteria)}</strong>
          <span>critério mais usado</span>
        </div>
      </div>
      <input
        aria-label="Filtrar conquistas"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Filtrar conquistas"
      />
      <ul className="stacked-list">
        {visibleBadges.map((badge) => (
          <li key={badge.id} className="stacked-list-item">
            <div>
              <div className="admin-badge-title-row">
                <strong>{badge.name}</strong>
                <span className={badge.active ? "import-badge" : "status-pill status-pill--muted"}>
                  {badge.active ? "Ativa" : "Inativa"}
                </span>
              </div>
              <p className="section-sub">
                {formatBadgeCode(badge.code)}. Critério: {formatBadgeCriteria(badge.criteriaType)}. Valor: {badge.criteriaValue ?? "sem valor"}.
              </p>
              {badge.description && <small>{badge.description}</small>}
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(badge)}>
                Editar
              </button>
              <button type="button" className="btn-muted btn-danger" disabled={busyKey === `badge-delete-${badge.id}`} onClick={() => onDelete(badge.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredBadges.length === 0 && <AdminEmptyState title="Nenhuma conquista encontrada" message="Revise o filtro ou cadastre uma conquista para acompanhar o engajamento." />}
      {filteredBadges.length > pageSize && (
        <div className="pagination-row">
          <button type="button" className="btn-muted" disabled={page <= 0} onClick={() => setPage((previous) => Math.max(0, previous - 1))}>
            Anterior
          </button>
          <span className="section-sub">Página {page + 1} de {totalPages}</span>
          <button type="button" className="btn-muted" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}>
            Próxima
          </button>
        </div>
      )}
    </article>
  );
}
