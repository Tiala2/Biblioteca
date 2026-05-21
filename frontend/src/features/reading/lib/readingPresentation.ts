import { formatDateTimeBr } from "@shared/lib/formatters";

const PHASE_LABEL: Record<string, string> = {
  BEGINNING: "Início",
  MIDDLE: "Meio",
  CLIMAX: "Clímax",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Concluído",
  DROPPED: "Interrompido",
  READING: "Em leitura",
};

const ROLE_LABEL: Record<string, string> = {
  ALLY: "Aliado",
  ANTAGONIST: "Antagonista",
  MENTOR: "Mentor",
  PROTAGONIST: "Protagonista",
  SUPPORT: "Apoio",
};

const NARRATIVE_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAliancas\b/g, "Alianças"],
  [/\baliancas\b/g, "alianças"],
  [/\bTraicoes\b/g, "Traições"],
  [/\btraicoes\b/g, "traições"],
  [/\brelacoes\b/g, "relações"],
  [/\bRelacoes\b/g, "Relações"],
  [/\bequilibrio\b/g, "equilíbrio"],
  [/\bEquilibrio\b/g, "Equilíbrio"],
  [/\bestrategia\b/g, "estratégia"],
  [/\bEstrategia\b/g, "Estratégia"],
  [/\badaptacao\b/g, "adaptação"],
  [/\bAdaptacao\b/g, "Adaptação"],
  [/\bcalculo\b/g, "cálculo"],
  [/\bCalculo\b/g, "Cálculo"],
  [/\bpolitico\b/g, "político"],
  [/\bPolitico\b/g, "Político"],
  [/\bclimax\b/g, "clímax"],
  [/\bClimax\b/g, "Clímax"],
  [/\bausencia\b/g, "ausência"],
  [/\bAusencia\b/g, "Ausência"],
  [/\binstaveis\b/g, "instáveis"],
  [/\bInstaveis\b/g, "Instáveis"],
];

export function clampPage(value: number, totalPages: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.round(value), Math.max(totalPages, 1)));
}

export function getPhaseLabel(phase?: string | null): string {
  if (!phase) return "Não definida";
  return PHASE_LABEL[phase] ?? humanizeNarrativeText(phase);
}

export function formatStatusLabel(status?: string | null): string {
  if (!status) return "Não iniciado";
  return STATUS_LABEL[status] ?? humanizeNarrativeText(status);
}

export function formatDateLabel(value?: string | null): string {
  if (!value) return "Ainda sem registro";
  const formatted = formatDateTimeBr(value);
  return formatted === "Invalid Date" ? "Ainda sem registro" : formatted;
}

export function formatNarrativeRole(role?: string | null): string {
  if (!role) return "Personagem";
  return ROLE_LABEL[role] ?? humanizeNarrativeText(role.replaceAll("_", " ").toLowerCase());
}

export function humanizeNarrativeText(value?: string | null): string {
  if (!value) return "";
  return NARRATIVE_TEXT_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value
  );
}
