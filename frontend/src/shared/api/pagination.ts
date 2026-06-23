import { api } from "./http";
import type { AxiosRequestConfig } from "axios";

type PageResponse<T> = {
  content: T[];
  page?: {
    totalPages?: number;
  };
};

export async function loadAllPaged<T>(path: string, pageSize = 100, config?: AxiosRequestConfig) {
  const separator = path.includes("?") ? "&" : "?";
  const firstResponse = await api.get<PageResponse<T>>(`${path}${separator}page=0&size=${pageSize}`, config);
  const items = [...firstResponse.data.content];
  const totalPages = firstResponse.data.page?.totalPages ?? 1;

  for (let page = 1; page < totalPages; page += 1) {
    const response = await api.get<PageResponse<T>>(`${path}${separator}page=${page}&size=${pageSize}`, config);
    items.push(...response.data.content);
  }

  return items;
}
