export type AdminSectionKey = "catalog" | "engagement" | "users" | "alerts";

export const ADMIN_SECTION_IDS: Record<AdminSectionKey, string> = {
  catalog: "admin-books",
  engagement: "admin-badges",
  users: "admin-users",
  alerts: "admin-alerts",
};

export const ADMIN_ROUTE_SECTION: Record<string, AdminSectionKey | undefined> = {
  "/admin/catalog": "catalog",
  "/admin/engagement": "engagement",
  "/admin/users": "users",
  "/admin/alerts": "alerts",
};
