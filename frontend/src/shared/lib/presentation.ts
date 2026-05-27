type BookSource = "LOCAL" | "OPEN" | "GUTENBERG" | string | undefined | null;

const READING_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Concluída",
  NOT_STARTED: "Não iniciada",
  DROPPED: "Interrompida",
};

export function formatBookSource(source?: BookSource) {
  if (source === "GUTENBERG") return "Project Gutenberg";
  if (source === "OPEN") return "Open Library";
  return "Acervo interno";
}

export function formatReadingMode(hasPdf?: boolean, source?: BookSource) {
  if (hasPdf && source === "GUTENBERG") return "Leitura interna";
  if (hasPdf) return "Leitura no app";
  if (source === "OPEN") return "Leitura externa";
  return "Progresso manual";
}

export function formatReadingStatus(status?: string | null) {
  if (!status) return "Ainda sem registro";
  return READING_STATUS_LABELS[status] ?? status.replaceAll("_", " ").toLowerCase();
}

export function pluralizePt(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
