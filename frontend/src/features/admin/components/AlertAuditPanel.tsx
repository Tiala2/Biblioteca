import { useMemo, useState } from "react";
import { formatDateTimeBr } from "@shared/lib/formatters";
import type { AlertDeliveryAdmin } from "../types";

type AlertAuditPanelProps = {
  deliveries: AlertDeliveryAdmin[];
};

export function AlertAuditPanel({ deliveries }: AlertAuditPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredDeliveries = useMemo(() => {
    if (!normalizedSearch) return deliveries;
    return deliveries.filter((delivery) =>
      `${delivery.email} ${delivery.alertType} ${delivery.status} ${delivery.channel} ${delivery.message}`.toLowerCase().includes(normalizedSearch)
    );
  }, [deliveries, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredDeliveries.length / pageSize));
  const visibleDeliveries = filteredDeliveries.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-alerts" className="card admin-panel">
      <div className="section-head">
        <h3>Auditoria de alertas</h3>
        <span className="kpi">{filteredDeliveries.length}</span>
      </div>
      <p className="section-sub">
        Acompanhe entregas de alertas por e-mail e o resultado de cada envio.
      </p>
      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Filtrar alertas por email, tipo ou status"
      />
      <ul className="stacked-list">
        {visibleDeliveries.map((delivery) => (
          <li key={delivery.id} className="stacked-list-item">
            <div>
              <strong>{delivery.email}</strong>
              <p className="section-sub">{delivery.alertType} | {delivery.channel} | {delivery.status}</p>
              <p>{delivery.message}</p>
              <small>Registrado em {formatDateTimeBr(delivery.createdAt)}</small>
            </div>
            <span className={delivery.status === "SENT" ? "favorite-badge" : "import-badge"}>{delivery.status}</span>
          </li>
        ))}
      </ul>
      {filteredDeliveries.length === 0 && <p className="section-sub">Nenhum alerta encontrado para esse filtro.</p>}
      {filteredDeliveries.length > pageSize && (
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
