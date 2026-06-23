import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@shared/api/http";
import { loadAllPaged } from "@shared/api/pagination";
import type { Badge, Book, Category, Collection, FavoriteAdmin, Metrics, Tag } from "../types";

type UseAdminStaticDataParams = {
  headers?: Record<string, string>;
};

type StaticDataSection = "metrics" | "categories" | "tags" | "books" | "collections" | "badges" | "favorites";

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
  const uploadBookIdRef = useRef("");
  const coverBookIdRef = useRef("");
  const requestVersionsRef = useRef<Record<StaticDataSection, number>>({
    metrics: 0,
    categories: 0,
    tags: 0,
    books: 0,
    collections: 0,
    badges: 0,
    favorites: 0,
  });

  const beginRequest = useCallback((section: StaticDataSection) => {
    requestVersionsRef.current[section] += 1;
    return requestVersionsRef.current[section];
  }, []);

  const isLatestRequest = useCallback(
    (section: StaticDataSection, version: number) => requestVersionsRef.current[section] === version,
    [],
  );

  const updateUploadBookId = useCallback((value: string) => {
    uploadBookIdRef.current = value;
    setUploadBookId(value);
  }, []);

  const updateCoverBookId = useCallback((value: string) => {
    coverBookIdRef.current = value;
    setCoverBookId(value);
  }, []);

  const reloadMetrics = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("metrics");
    const response = await api.get<Metrics>("/api/admin/metrics", { headers });
    if (isLatestRequest("metrics", version)) setMetrics(response.data);
  }, [beginRequest, headers, isLatestRequest]);

  const reloadCategories = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("categories");
    const response = await api.get<Category[]>("/api/admin/categories", { headers });
    if (isLatestRequest("categories", version)) setCategories(response.data);
  }, [beginRequest, headers, isLatestRequest]);

  const reloadTags = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("tags");
    const response = await api.get<Tag[]>("/api/admin/tags", { headers });
    if (isLatestRequest("tags", version)) setTags(response.data);
  }, [beginRequest, headers, isLatestRequest]);

  const reloadBooks = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("books");
    const nextBooks = await loadAllPaged<Book>("/api/v1/books?includeWithoutPdf=true");
    if (!isLatestRequest("books", version)) return;
    setBooks(nextBooks);
    if (nextBooks[0]) {
      if (!uploadBookIdRef.current) {
        updateUploadBookId(nextBooks[0].id);
      }
      if (!coverBookIdRef.current) {
        updateCoverBookId(nextBooks[0].id);
        setCoverBookUrl(nextBooks[0].coverUrl ?? "");
      }
    }
  }, [beginRequest, headers, isLatestRequest, updateCoverBookId, updateUploadBookId]);

  const reloadCollections = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("collections");
    const nextCollections = await loadAllPaged<Collection>("/api/v1/collections?sort=createdAt,desc");
    if (isLatestRequest("collections", version)) setCollections(nextCollections);
  }, [beginRequest, headers, isLatestRequest]);

  const reloadBadges = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("badges");
    const nextBadges = await loadAllPaged<Badge>("/api/admin/badges?sort=code", 100, { headers });
    if (isLatestRequest("badges", version)) setBadges(nextBadges);
  }, [beginRequest, headers, isLatestRequest]);

  const reloadFavorites = useCallback(async () => {
    if (!headers) return;
    const version = beginRequest("favorites");
    const nextFavorites = await loadAllPaged<FavoriteAdmin>("/api/admin/favorites?sort=createdAt,desc", 100, { headers });
    if (isLatestRequest("favorites", version)) setFavorites(nextFavorites);
  }, [beginRequest, headers, isLatestRequest]);

  const loadStaticData = useCallback(async () => {
    if (!headers) return;
    const failedSections: string[] = [];
    const versions: Record<StaticDataSection, number> = {
      metrics: beginRequest("metrics"),
      categories: beginRequest("categories"),
      tags: beginRequest("tags"),
      books: beginRequest("books"),
      collections: beginRequest("collections"),
      badges: beginRequest("badges"),
      favorites: beginRequest("favorites"),
    };
    const [m, c, t, b, col, bd, f] = await Promise.allSettled([
      api.get<Metrics>("/api/admin/metrics", { headers }),
      api.get<Category[]>("/api/admin/categories", { headers }),
      api.get<Tag[]>("/api/admin/tags", { headers }),
      loadAllPaged<Book>("/api/v1/books?includeWithoutPdf=true"),
      loadAllPaged<Collection>("/api/v1/collections?sort=createdAt,desc"),
      loadAllPaged<Badge>("/api/admin/badges?sort=code", 100, { headers }),
      loadAllPaged<FavoriteAdmin>("/api/admin/favorites?sort=createdAt,desc", 100, { headers }),
    ]);

    if (isLatestRequest("metrics", versions.metrics)) {
      if (m.status === "fulfilled") setMetrics(m.value.data);
      else failedSections.push("métricas");
    }

    if (isLatestRequest("categories", versions.categories)) {
      if (c.status === "fulfilled") setCategories(c.value.data);
      else failedSections.push("categorias");
    }

    if (isLatestRequest("tags", versions.tags)) {
      if (t.status === "fulfilled") setTags(t.value.data);
      else failedSections.push("tags");
    }

    if (isLatestRequest("books", versions.books)) {
      if (b.status === "fulfilled") {
        const nextBooks = b.value;
        setBooks(nextBooks);
        if (nextBooks[0]) {
          if (!uploadBookIdRef.current) {
            updateUploadBookId(nextBooks[0].id);
          }
          if (!coverBookIdRef.current) {
            updateCoverBookId(nextBooks[0].id);
            setCoverBookUrl(nextBooks[0].coverUrl ?? "");
          }
        }
      } else {
        failedSections.push("livros");
      }
    }

    if (isLatestRequest("collections", versions.collections)) {
      if (col.status === "fulfilled") setCollections(col.value);
      else failedSections.push("coleções");
    }

    if (isLatestRequest("badges", versions.badges)) {
      if (bd.status === "fulfilled") setBadges(bd.value);
      else failedSections.push("badges");
    }

    if (isLatestRequest("favorites", versions.favorites)) {
      if (f.status === "fulfilled") setFavorites(f.value);
      else failedSections.push("favoritos");
    }

    setError(failedSections.length ? `Não foi possível carregar: ${failedSections.join(", ")}.` : "");
  }, [beginRequest, headers, isLatestRequest, updateCoverBookId, updateUploadBookId]);

  useEffect(() => {
    void Promise.resolve().then(loadStaticData);
  }, [loadStaticData]);

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
    setUploadBookId: updateUploadBookId,
    coverBookId,
    setCoverBookId: updateCoverBookId,
    coverBookUrl,
    setCoverBookUrl,
    reload: loadStaticData,
    reloadMetrics,
    reloadCategories,
    reloadTags,
    reloadBooks,
    reloadCollections,
    reloadBadges,
    reloadFavorites,
  };
}
