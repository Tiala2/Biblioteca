import type { AlertDeliveryAdmin, BadgeCode, BadgeCriteria, FavoriteAdmin, UserAdmin } from "../types";

const BADGE_CODE_LABELS: Record<BadgeCode, string> = {
  FIRST_BOOK_FINISHED: "Primeiro livro concluído",
  STREAK_7_DAYS: "Sequência de 7 dias",
  STREAK_30_DAYS: "Sequência de 30 dias",
  TOTAL_BOOKS_10: "10 livros concluídos",
  TOTAL_PAGES_1000: "1.000 páginas lidas",
};

const BADGE_CRITERIA_LABELS: Record<BadgeCriteria, string> = {
  FIRST_BOOK: "Primeiro livro",
  STREAK_DAYS: "Dias em sequência",
  TOTAL_BOOKS: "Livros concluídos",
  TOTAL_PAGES: "Páginas lidas",
};

const ALERT_TYPE_LABELS: Record<AlertDeliveryAdmin["alertType"], string> = {
  GOAL_EXPIRING: "Meta vencendo",
  PACE_WARNING: "Ritmo em risco",
  NO_STREAK: "Sem sequência",
};

const ALERT_STATUS_LABELS: Record<AlertDeliveryAdmin["status"], string> = {
  SENT: "Enviado",
  FAILED: "Falhou",
  SKIPPED: "Ignorado",
};

export function formatAdminRole(role: UserAdmin["role"]) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}

export function formatFavoriteSource(source?: FavoriteAdmin["source"]) {
  return source === "OPEN" ? "Open Library" : "Acervo interno";
}

export function formatBadgeCode(code: BadgeCode) {
  return BADGE_CODE_LABELS[code] ?? code;
}

export function formatBadgeCriteria(criteria: BadgeCriteria) {
  return BADGE_CRITERIA_LABELS[criteria] ?? criteria;
}

export function formatAlertType(type: AlertDeliveryAdmin["alertType"]) {
  return ALERT_TYPE_LABELS[type] ?? type;
}

export function formatAlertStatus(status: AlertDeliveryAdmin["status"]) {
  return ALERT_STATUS_LABELS[status] ?? status;
}
