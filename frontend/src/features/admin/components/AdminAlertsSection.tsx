import { AlertAuditPanel } from "./AlertAuditPanel";
import { AdminSection } from "./AdminSection";
import type { AlertDeliveryAdmin } from "../types";

type AdminAlertsSectionProps = {
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

export function AdminAlertsSection(props: AdminAlertsSectionProps) {
  return (
    <AdminSection
      eyebrow="Auditoria"
      title="Alertas e rastreabilidade"
      description="Filtre entregas de alertas por texto, status e tipo sem depender de busca local limitada."
    >
      <AlertAuditPanel {...props} />
    </AdminSection>
  );
}
