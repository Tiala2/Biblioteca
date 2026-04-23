import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { UserAdmin, UserForm } from "../types";

type UserPanelProps = {
  form: UserForm;
  users: UserAdmin[];
  currentUserEmail: string;
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: UserForm) => UserForm) => void;
  onEdit: (user: UserAdmin) => void;
  onReset: () => void;
  onInvalidate: (userId: string) => void;
  onReactivate: (userId: string) => void;
};

export function UserPanel({
  form,
  users,
  currentUserEmail,
  busyKey,
  onSubmit,
  onFormChange,
  onEdit,
  onReset,
  onInvalidate,
  onReactivate,
}: UserPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(normalizedSearch));
  }, [users, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-users" className="card admin-panel admin-panel--wide">
      <div className="section-head">
        <h3>Gestao de usuarios</h3>
        <span className="kpi">{filteredUsers.length}</span>
      </div>
      <p className="section-sub">
        Edite dados basicos, controle preferencias e bloqueie ou reative acesso sem apagar historico.
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

      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Filtrar usuarios por nome ou email"
      />
      <ul className="stacked-list">
        {visibleUsers.map((user) => {
          const isCurrentUser = user.email.toLowerCase() === currentUserEmail.toLowerCase();
          const isBusy = busyKey === `user-invalidate-${user.id}`;
          return (
            <li key={user.id} className="stacked-list-item">
              <div>
                <strong>{user.name}</strong>
                <p className="section-sub">{user.email}</p>
                <p className="section-sub">
                  {user.active ? "Acesso ativo" : "Acesso invalidado"} | Ranking {user.leaderboardOptIn ? "ativo" : "desligado"} | Alertas {user.alertsOptIn ? "ativos" : "desligados"}
                </p>
              </div>
              <div className="card-actions">
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
      {filteredUsers.length === 0 && <p className="section-sub">Nenhum usuario encontrado para esse filtro.</p>}
      {filteredUsers.length > pageSize && (
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
