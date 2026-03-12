import { isAxiosError } from "axios";

type FieldError = {
  field?: string;
  message?: string;
};

type ApiErrorPayload = {
  code?: string;
  message?: string;
  fieldErrors?: FieldError[];
};

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorPayload>(error)) return fallback;
  if (!error.response) return "Falha de conexao com o servidor.";
  return error.response.data?.message ?? fallback;
}

export function extractFieldErrorMessages(error: unknown): string[] {
  if (!isAxiosError<ApiErrorPayload>(error)) return [];
  const fieldErrors = error.response?.data?.fieldErrors;
  if (!Array.isArray(fieldErrors)) return [];
  return fieldErrors
    .map((item) => {
      const field = item.field?.trim();
      const message = item.message?.trim();
      if (!message) return "";
      return field ? `${field}: ${message}` : message;
    })
    .filter((value) => value.length > 0);
}

