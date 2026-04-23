import type { BookDetail, CachedReaderLookup } from "../types";

const OPEN_LIBRARY_READER_CACHE_KEY = "library.openlibrary.reader-cache.v1";
const OPEN_LIBRARY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

function getReaderCacheKey(book: BookDetail): string {
  return `${book.id}::${book.isbn ?? ""}::${book.title}`.toLowerCase();
}

export function readReaderCache(book: BookDetail): CachedReaderLookup | null {
  const raw = localStorage.getItem(OPEN_LIBRARY_READER_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, CachedReaderLookup>;
    const value = parsed[getReaderCacheKey(book)];
    if (!value) return null;
    if (Date.now() - value.cachedAt > OPEN_LIBRARY_CACHE_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeReaderCache(book: BookDetail, value: Omit<CachedReaderLookup, "cachedAt">) {
  const raw = localStorage.getItem(OPEN_LIBRARY_READER_CACHE_KEY);
  let parsed: Record<string, CachedReaderLookup> = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, CachedReaderLookup>;
    } catch {
      parsed = {};
    }
  }

  parsed[getReaderCacheKey(book)] = {
    ...value,
    cachedAt: Date.now(),
  };

  localStorage.setItem(OPEN_LIBRARY_READER_CACHE_KEY, JSON.stringify(parsed));
}
