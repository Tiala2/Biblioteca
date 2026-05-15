import { useMemo } from "react";
import { formatDateTimeBr } from "@shared/lib/formatters";
import type { AlertDeliveryAdmin } from "../types";
import { AdminEmptyState } from "./AdminEmptyState";

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

function getAlertStatusLabel(status: AlertDeliveryAdmin["status"]) {
  if (status === "SENT") return "ENVIADO";
  if (status === "FAILED") return "FALHO";
  return "IGNORADO";
}

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
  const alertInsights = useMemo(() => {
    const sentCount = deliveries.filter((delivery) => delivery.status === "SENT").length;
    const failedCount = deliveries.filter((delivery) => delivery.status === "FAILED").length;
    const skippedCount = deliveries.filter((delivery) => delivery.status === "SKIPPED").length;
    const latest = deliveries.reduce<AlertDeliveryAdmin | null>((current, delivery) => {
      if (!delivery.createdAt) return current;
      if (!current?.createdAt) return delivery;
      return new Date(delivery.createdAt).getTime() > new Date(current.createdAt).getTime() ? delivery : current;
    }, null);

    return { failedCount, latest, sentCount, skippedCount };
  }, [deliveries]);

  return (
    <article id="admin-alerts" className="card admin-panel">
      <div className="section-head">
        <h3>Auditoria de alertas</h3>
        <span className="kpi">{loading ? "..." : totalDeliveries}</span>
      </div>
      <p className="section-sub">Acompanhe entregas de alertas por e-mail e o resultado de cada envio.</p>
      <div className="admin-alert-summary">
        <div className="stat-box admin-list-stat">
          <strong>{loading ? "..." : alertInsights.sentCount}</strong>
          <span>enviados na página</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? "..." : alertInsights.failedCount}</strong>
          <span>falhos na página</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? "..." : alertInsights.skippedCount}</strong>
          <span>ignorados na página</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{alertInsights.latest ? formatDateTimeBr(alertInsights.latest.createdAt) : "-"}</strong>
          <span>último registro</span>
        </div>
      </div>
      <div className="filters-grid admin-filters-grid">
        <input
          aria-label="Buscar alertas por email, tipo, canal ou mensagem"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por email, tipo, canal ou mensagem"
        />
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
            <option value="NO_STREAK">Sem sequência</option>
          </select>
        </label>
        <div className="stat-box admin-list-stat">
          <strong>{loading ? "..." : deliveries.length}</strong>
          <span>na página atual</span>
        </div>
      </div>
      {loading && <p className="section-sub">Carregando alertas...</p>}
      <ul className="stacked-list">
        {deliveries.map((delivery) => (
          <li key={delivery.id} className="stacked-list-item">
            <div>
              <div className="admin-alert-title-row">
                <strong>{delivery.email}</strong>
                <span className={delivery.status === "SENT" ? "import-badge" : "status-pill status-pill--muted"}>
                  {getAlertStatusLabel(delivery.status)}
                </span>
              </div>
              <p className="section-sub">
                {delivery.alertType} | {delivery.channel} | {delivery.status}
              </p>
              <p>{delivery.message}</p>
              <small>Registrado em {formatDateTimeBr(delivery.createdAt)}</small>
            </div>
          </li>
        ))}
      </ul>
      {!loading && deliveries.length === 0 && <AdminEmptyState title="Nenhum alerta encontrado" message="Revise status, tipo ou período para encontrar entregas registradas." />}
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
