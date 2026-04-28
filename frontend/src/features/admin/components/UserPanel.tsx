import type { FormEvent } from "react";
import type { UserAdmin, UserForm } from "../types";

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

  return (
    <article id="admin-users" className="card admin-panel admin-panel--wide">
      <div className="section-head">
        <h3>Gestao de usuarios</h3>
        <span className="kpi">{loading ? "..." : totalUsers}</span>
      </div>
      <p className="section-sub">
        Edite dados basicos, controle preferencias, governe papeis e bloqueie ou reative acesso sem apagar historico.
      </p>

      <form className="admin-form admin-user-form" onSubmit={onSubmit}>
        <input
          value={form.name}
          onChange={(event) => onFormChange((previous) => ({ ...previous, name: event.target.value }))}
          placeholder="Nome do usuario"
          required
        />
        <input
          value={form.email}
          onChange={(event) => onFormChange((previous) => ({ ...previous, email: event.target.value }))}
          placeholder="Email do usuario"
          type="email"
          required
        />
        <label className="field-stack">
          <span>Papel do usuario</span>
          <select
            aria-label="Papel do usuario"
            value={form.role}
            onChange={(event) => onFormChange((previous) => ({ ...previous, role: event.target.value as UserForm["role"] }))}
          >
            <option value="USER" disabled={isEditingCurrentUser}>
              Usuario
            </option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        {isEditingCurrentUser && <p className="section-sub">Seu proprio acesso administrativo nao pode ser rebaixado pelo painel.</p>}
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
            {busyKey === `user-save-${form.id}` ? "Salvando..." : form.id ? "Salvar usuario" : "Selecione um usuario"}
          </button>
          {form.id && (
            <button type="button" className="btn-muted" onClick={onReset}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="filters-grid admin-filters-grid">
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar usuarios por nome ou email" />
        <label className="field-stack">
          <span>Status</span>
          <select value={activeFilter} onChange={(event) => onActiveFilterChange(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}>
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Invalidos</option>
          </select>
        </label>
        <label className="field-stack">
          <span>Papel</span>
          <select value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value as "ALL" | "USER" | "ADMIN")}>
            <option value="ALL">Todos</option>
            <option value="USER">Usuarios</option>
            <option value="ADMIN">Admins</option>
          </select>
        </label>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? "..." : users.length}</strong>
          <span>na pagina atual</span>
        </div>
      </div>

      {loading && <p className="section-sub">Carregando usuarios...</p>}
      <ul className="stacked-list">
        {users.map((user) => {
          const isCurrentUser = user.email.toLowerCase() === currentUserEmail.toLowerCase();
          const isBusy = busyKey === `user-invalidate-${user.id}`;
          return (
            <li key={user.id} className="stacked-list-item">
              <div>
                <strong>{user.name}</strong>
                <p className="section-sub">{user.email}</p>
                <p className="section-sub">
                  {user.active ? "Acesso ativo" : "Acesso invalidado"} | Papel {user.role === "ADMIN" ? "admin" : "usuario"} | Ranking{" "}
                  {user.leaderboardOptIn ? "ativo" : "desligado"} | Alertas {user.alertsOptIn ? "ativos" : "desligados"}
                </p>
              </div>
              <div className="card-actions">
                <span className={user.role === "ADMIN" ? "import-badge" : "favorite-badge"}>{user.role}</span>
                <span className={user.active ? "import-badge" : "favorite-badge"}>{user.active ? "ATIVO" : "INVALIDADO"}</span>
                <button type="button" className="btn-muted" onClick={() => onEdit(user)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-muted"
                  disabled={isBusy || !user.active || isCurrentUser}
                  onClick={() => onInvalidate(user.id)}
                  title={isCurrentUser ? "Nao e permitido invalidar o proprio acesso pelo painel." : undefined}
                >
                  {isBusy ? "Processando..." : user.active ? "Invalidar acesso" : "Acesso invalidado"}
                </button>
                {!user.active && (
                  <button
                    type="button"
                    className="btn-muted"
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
      {!loading && users.length === 0 && <p className="section-sub">Nenhum usuario encontrado para esse filtro.</p>}
      <div className="pagination-row">
        <button type="button" className="btn-muted" disabled={currentPage <= 0 || loading} onClick={() => onPageChange(currentPage - 1)}>
          Anterior
        </button>
        <span className="section-sub">
          Pagina {currentPage + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn-muted"
          disabled={loading || currentPage + 1 >= Math.max(totalPages, 1)}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Proxima
        </button>
      </div>
    </article>
  );
}
