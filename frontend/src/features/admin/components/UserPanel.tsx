import type { FormEvent } from "react";
import { useMemo } from "react";
import type { UserAdmin, UserForm } from "../types";
import { formatAdminRole } from "../lib/labels";
import { AdminEmptyState } from "./AdminEmptyState";

type UserPanelProps = {
  form: UserForm;
  users: UserAdmin[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  search: string;
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  roleFilter: "ALL" | "USER" | "ADMIN";
  loading: boolean;
  currentUserEmail: string;
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: UserForm) => UserForm) => void;
  onEdit: (user: UserAdmin) => void;
  onReset: () => void;
  onInvalidate: (userId: string) => void;
  onReactivate: (userId: string) => void;
  onSearchChange: (value: string) => void;
  onActiveFilterChange: (value: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onRoleFilterChange: (value: "ALL" | "USER" | "ADMIN") => void;
  onPageChange: (page: number) => void;
};

export function UserPanel({
  form,
  users,
  totalUsers,
  currentPage,
  totalPages,
  search,
  activeFilter,
  roleFilter,
  loading,
  currentUserEmail,
  busyKey,
  onSubmit,
  onFormChange,
  onEdit,
  onReset,
  onInvalidate,
  onReactivate,
  onSearchChange,
  onActiveFilterChange,
  onRoleFilterChange,
  onPageChange,
}: UserPanelProps) {
  const isEditingCurrentUser = form.email.trim().toLowerCase() === currentUserEmail.toLowerCase();
  const loadingLabel = "Carregando";
  const userInsights = useMemo(() => {
    const activeCount = users.filter((user) => user.active).length;
    const adminCount = users.filter((user) => user.role === "ADMIN").length;
    const rankingCount = users.filter((user) => user.leaderboardOptIn).length;
    const alertsCount = users.filter((user) => user.alertsOptIn).length;

    return { activeCount, adminCount, alertsCount, rankingCount };
  }, [users]);

  return (
    <article id="admin-users" className="card admin-panel admin-panel--wide">
      <div className="section-head">
        <h3>Usuários e permissões</h3>
        <span className="kpi">{loading ? loadingLabel : totalUsers}</span>
      </div>
      <p className="section-sub">
        Edite dados básicos, controle preferências, governe papéis e bloqueie ou reative acesso sem apagar histórico.
      </p>

      <form className="admin-form admin-user-form" onSubmit={onSubmit}>
        <input
          aria-label="Nome do usuário"
          value={form.name}
          onChange={(event) => onFormChange((previous) => ({ ...previous, name: event.target.value }))}
          placeholder="Nome do usuário"
          required
        />
        <input
          aria-label="Email do usuário"
          value={form.email}
          onChange={(event) => onFormChange((previous) => ({ ...previous, email: event.target.value }))}
          placeholder="Email do usuário"
          type="email"
          required
        />
        <label className="field-stack">
          <span>Papel do usuário</span>
          <select
            aria-label="Papel do usuário"
            value={form.role}
            onChange={(event) => onFormChange((previous) => ({ ...previous, role: event.target.value as UserForm["role"] }))}
          >
            <option value="USER" disabled={isEditingCurrentUser}>
              Usuário
            </option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
        {isEditingCurrentUser && <p className="section-sub">Seu próprio acesso administrativo não pode ser rebaixado pelo painel.</p>}
        <label className="check-inline">
          <input
            type="checkbox"
            checked={form.leaderboardOptIn}
            onChange={(event) => onFormChange((previous) => ({ ...previous, leaderboardOptIn: event.target.checked }))}
          />
          Participar do ranking
        </label>
        <label className="check-inline">
          <input
            type="checkbox"
            checked={form.alertsOptIn}
            onChange={(event) => onFormChange((previous) => ({ ...previous, alertsOptIn: event.target.checked }))}
          />
          Receber alertas
        </label>
        <div className="card-actions">
          <button type="submit" disabled={!form.id || busyKey === `user-save-${form.id}`}>
            {busyKey === `user-save-${form.id}` ? "Salvando..." : form.id ? "Salvar usuário" : "Selecione um usuário"}
          </button>
          {form.id && (
            <button type="button" className="btn-muted" onClick={onReset}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="admin-user-summary">
        <div className="stat-box admin-list-stat">
          <strong>{loading ? loadingLabel : userInsights.activeCount}</strong>
          <span>ativos na página</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? loadingLabel : userInsights.adminCount}</strong>
          <span>admins na página</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? loadingLabel : userInsights.rankingCount}</strong>
          <span>no ranking</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? loadingLabel : userInsights.alertsCount}</strong>
          <span>com alertas</span>
        </div>
      </div>

      <div className="filters-grid admin-filters-grid">
        <input
          aria-label="Buscar usuários por nome ou email"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar usuários por nome ou email"
        />
        <label className="field-stack">
          <span>Status</span>
          <select aria-label="Filtrar usuários por status" value={activeFilter} onChange={(event) => onActiveFilterChange(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}>
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inválidos</option>
          </select>
        </label>
        <label className="field-stack">
          <span>Papel</span>
          <select aria-label="Filtrar usuários por papel" value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value as "ALL" | "USER" | "ADMIN")}>
            <option value="ALL">Todos</option>
            <option value="USER">Usuários</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </label>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? loadingLabel : users.length}</strong>
          <span>na página atual</span>
        </div>
      </div>

      {loading && <p className="section-sub">Carregando usuários...</p>}
      <ul className="stacked-list">
        {users.map((user) => {
          const isCurrentUser = user.email.toLowerCase() === currentUserEmail.toLowerCase();
          const isBusy = busyKey === `user-invalidate-${user.id}`;
          return (
            <li key={user.id} className="stacked-list-item">
              <div>
                <div className="admin-user-title-row">
                  <strong>{user.name}</strong>
                  <span className={user.role === "ADMIN" ? "import-badge" : "status-pill status-pill--muted"}>{formatAdminRole(user.role)}</span>
                  <span className={user.active ? "import-badge" : "status-pill status-pill--muted"}>
                    {user.active ? "Ativo" : "Invalidado"}
                  </span>
                </div>
                <p className="section-sub email-text">{user.email}</p>
                <p className="section-sub">
                  Ranking {user.leaderboardOptIn ? "ativo" : "desligado"}. Alertas {user.alertsOptIn ? "ativos" : "desligados"}.
                </p>
              </div>
              <div className="card-actions">
                <button type="button" className="btn-muted" onClick={() => onEdit(user)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-muted btn-danger"
                  disabled={isBusy || !user.active || isCurrentUser}
                  onClick={() => onInvalidate(user.id)}
                  title={isCurrentUser ? "Não é permitido invalidar o próprio acesso pelo painel." : undefined}
                >
                  {isBusy ? "Invalidando..." : user.active ? "Invalidar acesso" : "Acesso invalidado"}
                </button>
                {!user.active && (
                  <button
                    type="button"
                    className="btn-muted btn-success"
                    disabled={busyKey === `user-reactivate-${user.id}`}
                    onClick={() => onReactivate(user.id)}
                  >
                    {busyKey === `user-reactivate-${user.id}` ? "Reativando..." : "Reativar acesso"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!loading && users.length === 0 && <AdminEmptyState title="Nenhum usuário encontrado" message="Revise filtros de status, papel ou busca para localizar outros usuários." />}
      <div className="pagination-row">
        <button type="button" className="btn-muted" disabled={currentPage <= 0 || loading} onClick={() => onPageChange(currentPage - 1)}>
          Anterior
        </button>
        <span className="section-sub">
          Página {currentPage + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn-muted"
          disabled={loading || currentPage + 1 >= Math.max(totalPages, 1)}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Próxima
        </button>
      </div>
    </article>
  );
}
