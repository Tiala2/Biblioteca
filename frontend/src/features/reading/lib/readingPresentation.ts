import { formatDateTimeBr } from "@shared/lib/formatters";

const PHASE_LABEL: Record<string, string> = {
  BEGINNING: "Inicio",
  MIDDLE: "Meio",
  CLIMAX: "Climax",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Nao iniciado",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Concluido",
  DROPPED: "Interrompido",
  READING: "Em leitura",
};

export function clampPage(value: number, totalPages: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.round(value), Math.max(totalPages, 1)));
}

export function getPhaseLabel(phase?: string | null): string {
  if (!phase) return "Nao definida";
  return PHASE_LABEL[phase] ?? phase;
}

export function formatStatusLabel(status?: string | null): string {
  if (!status) return "Nao iniciado";
  return STATUS_LABEL[status] ?? status;
}

export function formatDateLabel(value?: string | null): string {
  if (!value) return "Sem registro";
  const formatted = formatDateTimeBr(value);
  return formatted === "Invalid Date" ? "Sem registro" : formatted;
}
