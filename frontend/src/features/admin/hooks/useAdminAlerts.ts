import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { api } from "@shared/api/http";
import { buildQuery, toPageTotals } from "../lib/page";
import type { AlertDeliveryAdmin, Page } from "../types";

type UseAdminAlertsParams = {
  headers?: Record<string, string>;
};

export function useAdminAlerts({ headers }: UseAdminAlertsParams) {
  const [deliveries, setDeliveries] = useState<AlertDeliveryAdmin[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AlertDeliveryAdmin["status"]>("ALL");
  const [alertTypeFilter, setAlertTypeFilter] = useState<"ALL" | AlertDeliveryAdmin["alertType"]>("ALL");
  const [page, setPage] = useState(0);

  const deferredSearch = useDeferredValue(search);

  const loadAlerts = useCallback(async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const query = buildQuery({
        page,
        size: 12,
        sort: "createdAt,desc",
        q: deferredSearch.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        alertType: alertTypeFilter === "ALL" ? undefined : alertTypeFilter,
      });
      const response = await api.get<Page<AlertDeliveryAdmin>>(`/api/admin/alerts/deliveries?${query}`, { headers });
      setDeliveries(response.data.content);
      const totals = toPageTotals(response.data);
      setTotalPages(totals.totalPages);
      setTotalDeliveries(totals.totalElements);
    } finally {
      setLoading(false);
    }
  }, [alertTypeFilter, deferredSearch, headers, page, statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadAlerts);
  }, [loadAlerts]);

  return {
    deliveries,
    totalPages,
    totalDeliveries,
    loading,
    search,
    statusFilter,
    alertTypeFilter,
    page,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
    setStatusFilter: (value: "ALL" | AlertDeliveryAdmin["status"]) => {
      setStatusFilter(value);
      setPage(0);
    },
    setAlertTypeFilter: (value: "ALL" | AlertDeliveryAdmin["alertType"]) => {
      setAlertTypeFilter(value);
      setPage(0);
    },
    setPage,
    reload: loadAlerts,
  };
}
