import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { api } from "@shared/api/http";
import { buildQuery, toPageTotals } from "../lib/page";
import type { Page, UserAdmin } from "../types";

type UseAdminUsersParams = {
  headers?: Record<string, string>;
};

export function useAdminUsers({ headers }: UseAdminUsersParams) {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [page, setPage] = useState(0);

  const deferredSearch = useDeferredValue(search);

  const loadUsers = useCallback(async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const query = buildQuery({
        page,
        size: 12,
        sort: "createdAt,desc",
        q: deferredSearch.trim() || undefined,
        active: activeFilter === "ALL" ? undefined : String(activeFilter === "ACTIVE"),
        role: roleFilter === "ALL" ? undefined : roleFilter,
      });
      const response = await api.get<Page<UserAdmin>>(`/api/admin/users?${query}`, { headers });
      setUsers(response.data.content);
      const totals = toPageTotals(response.data);
      setTotalPages(totals.totalPages);
      setTotalUsers(totals.totalElements);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, deferredSearch, headers, page, roleFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  return {
    users,
    totalPages,
    totalUsers,
    loading,
    search,
    activeFilter,
    roleFilter,
    page,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
    setActiveFilter: (value: "ALL" | "ACTIVE" | "INACTIVE") => {
      setActiveFilter(value);
      setPage(0);
    },
    setRoleFilter: (value: "ALL" | "USER" | "ADMIN") => {
      setRoleFilter(value);
      setPage(0);
    },
    setPage,
    reload: loadUsers,
  };
}
