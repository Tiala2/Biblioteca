import { useEffect, useState } from "react";
import { api } from "@shared/api/http";
import type { Badge, Book, Category, Collection, FavoriteAdmin, Metrics, Page, Tag } from "../types";

type UseAdminStaticDataParams = {
  headers?: Record<string, string>;
};

export function useAdminStaticData({ headers }: UseAdminStaticDataParams) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAdmin[]>([]);
  const [error, setError] = useState("");
  const [uploadBookId, setUploadBookId] = useState("");
  const [coverBookId, setCoverBookId] = useState("");
  const [coverBookUrl, setCoverBookUrl] = useState("");

  const loadStaticData = async () => {
    if (!headers) return;
    const failedSections: string[] = [];
    const [m, c, t, b, col, bd, f] = await Promise.allSettled([
      api.get<Metrics>("/api/admin/metrics", { headers }),
      api.get<Category[]>("/api/admin/categories", { headers }),
      api.get<Tag[]>("/api/admin/tags", { headers }),
      api.get<Page<Book>>("/api/v1/books?page=0&size=200&includeWithoutPdf=true"),
      api.get<Page<Collection>>("/api/v1/collections?page=0&size=50&sort=createdAt,desc"),
      api.get<Page<Badge>>("/api/admin/badges?page=0&size=50&sort=code", { headers }),
      api.get<Page<FavoriteAdmin>>("/api/admin/favorites?page=0&size=50&sort=createdAt,desc", { headers }),
    ]);

    if (m.status === "fulfilled") setMetrics(m.value.data);
    else failedSections.push("metricas");

    if (c.status === "fulfilled") setCategories(c.value.data);
    else failedSections.push("categorias");

    if (t.status === "fulfilled") setTags(t.value.data);
    else failedSections.push("tags");

    if (b.status === "fulfilled") {
      const nextBooks = b.value.data.content;
      setBooks(nextBooks);
      if (!uploadBookId && nextBooks[0]) setUploadBookId(nextBooks[0].id);
      if (!coverBookId && nextBooks[0]) {
        setCoverBookId(nextBooks[0].id);
        setCoverBookUrl(nextBooks[0].coverUrl ?? "");
      }
    } else {
      failedSections.push("livros");
    }

    if (col.status === "fulfilled") setCollections(col.value.data.content);
    else failedSections.push("colecoes");

    if (bd.status === "fulfilled") setBadges(bd.value.data.content);
    else failedSections.push("badges");

    if (f.status === "fulfilled") setFavorites(f.value.data.content);
    else failedSections.push("favoritos");

    setError(failedSections.length ? `Falha ao carregar: ${failedSections.join(", ")}.` : "");
  };

  useEffect(() => {
    void loadStaticData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers?.Authorization]);

  return {
    metrics,
    categories,
    tags,
    books,
    collections,
    badges,
    favorites,
    error,
    uploadBookId,
    setUploadBookId,
    coverBookId,
    setCoverBookId,
    coverBookUrl,
    setCoverBookUrl,
    reload: loadStaticData,
  };
}
