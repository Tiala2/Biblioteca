import { formatDateTimeBr } from "@shared/lib/formatters";
import type { AlertDeliveryAdmin } from "../types";

type AlertAuditPanelProps = {
  deliveries: AlertDeliveryAdmin[];
  totalDeliveries: number;
  currentPage: number;
  totalPages: number;
  search: string;
  statusFilter: "ALL" | AlertDeliveryAdmin["status"];
  alertTypeFilter: "ALL" | AlertDeliveryAdmin["alertType"];
  loading: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "ALL" | AlertDeliveryAdmin["status"]) => void;
  onAlertTypeFilterChange: (value: "ALL" | AlertDeliveryAdmin["alertType"]) => void;
  onPageChange: (page: number) => void;
};

export function AlertAuditPanel({
  deliveries,
  totalDeliveries,
  currentPage,
  totalPages,
  search,
  statusFilter,
  alertTypeFilter,
  loading,
  onSearchChange,
  onStatusFilterChange,
  onAlertTypeFilterChange,
  onPageChange,
}: AlertAuditPanelProps) {
  return (
    <article id="admin-alerts" className="card admin-panel">
      <div className="section-head">
        <h3>Auditoria de alertas</h3>
        <span className="kpi">{loading ? "..." : totalDeliveries}</span>
      </div>
      <p className="section-sub">Acompanhe entregas de alertas por e-mail e o resultado de cada envio.</p>
      <div className="filters-grid admin-filters-grid">
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por email, tipo, canal ou mensagem" />
        <label className="field-stack">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as "ALL" | AlertDeliveryAdmin["status"])}>
            <option value="ALL">Todos</option>
            <option value="SENT">Enviados</option>
            <option value="FAILED">Falhos</option>
            <option value="SKIPPED">Ignorados</option>
          </select>
        </label>
        <label className="field-stack">
          <span>Tipo</span>
          <select value={alertTypeFilter} onChange={(event) => onAlertTypeFilterChange(event.target.value as "ALL" | AlertDeliveryAdmin["alertType"])}>
            <option value="ALL">Todos</option>
            <option value="GOAL_EXPIRING">Meta expirando</option>
            <option value="PACE_WARNING">Ritmo em risco</option>
            <option value="NO_STREAK">Sem sequencia</option>
          </select>
        </label>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? "..." : deliveries.length}</strong>
          <span>na pagina atual</span>
        </div>
      </div>
      {loading && <p className="section-sub">Carregando alertas...</p>}
      <ul className="stacked-list">
        {deliveries.map((delivery) => (
          <li key={delivery.id} className="stacked-list-item">
            <div>
              <strong>{delivery.email}</strong>
              <p className="section-sub">
                {delivery.alertType} | {delivery.channel} | {delivery.status}
              </p>
              <p>{delivery.message}</p>
              <small>Registrado em {formatDateTimeBr(delivery.createdAt)}</small>
            </div>
            <span className={delivery.status === "SENT" ? "favorite-badge" : "import-badge"}>{delivery.status}</span>
          </li>
        ))}
      </ul>
      {!loading && deliveries.length === 0 && <p className="section-sub">Nenhum alerta encontrado para esse filtro.</p>}
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
