export function formatDateBr(value?: string | null) {
  if (!value) return "Sem data registrada";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatDateTimeBr(value?: string | null) {
  if (!value) return "Sem data registrada";
  return new Date(value).toLocaleString("pt-BR");
}

export function formatDecimal(value?: number | null, fractionDigits = 1) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatInteger(value?: number | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
}
