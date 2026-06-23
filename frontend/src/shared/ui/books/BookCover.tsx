import { useMemo, useState } from "react";

type BookCoverProps = {
  title: string;
  coverUrl?: string | null;
  isbn?: string | null;
  size?: "small" | "medium" | "large";
};

function buildInitials(title: string): string {
  const parts = title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "LV";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function normalizeIsbn(isbn?: string | null): string | null {
  const normalized = isbn?.replace(/[^0-9Xx]/g, "");
  return normalized ? normalized.toUpperCase() : null;
}

function isValidIsbn10(value: string): boolean {
  if (!/^\d{9}[\dX]$/.test(value)) return false;
  const sum = value.split("").reduce((total, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return total + digit * (10 - index);
  }, 0);
  return sum % 11 === 0;
}

function isValidIsbn13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const sum = value
    .slice(0, 12)
    .split("")
    .reduce((total, character, index) => total + Number(character) * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(value.at(12));
}

function isValidIsbn(value: string): boolean {
  return value.length === 10 ? isValidIsbn10(value) : value.length === 13 && isValidIsbn13(value);
}

function isPlaceholderCoverUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "example.com" || host.endsWith(".example.com") || host === "exemplo.com" || host.endsWith(".exemplo.com");
  } catch {
    return false;
  }
}

export function BookCover({ title, coverUrl, isbn, size = "medium" }: BookCoverProps) {
  const initials = buildInitials(title);
  const imageCandidates = useMemo(() => {
    const candidates = [];
    const manualCoverUrl = coverUrl?.trim();
    if (manualCoverUrl && !isPlaceholderCoverUrl(manualCoverUrl)) candidates.push(manualCoverUrl);

    const cleanIsbn = normalizeIsbn(isbn);
    if (cleanIsbn && isValidIsbn(cleanIsbn)) {
      candidates.push(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`);
    }

    return Array.from(new Set(candidates));
  }, [coverUrl, isbn]);
  const imageCandidatesKey = imageCandidates.join("|");
  const [failedState, setFailedState] = useState<{ key: string; urls: Set<string> }>(() => ({
    key: "",
    urls: new Set(),
  }));
  const [loadedState, setLoadedState] = useState<{ key: string; urls: Set<string> }>(() => ({
    key: "",
    urls: new Set(),
  }));
  const failedUrls = failedState.key === imageCandidatesKey ? failedState.urls : new Set<string>();
  const loadedUrls = loadedState.key === imageCandidatesKey ? loadedState.urls : new Set<string>();
  const imageUrl = imageCandidates.find((candidate) => !failedUrls.has(candidate)) ?? null;
  const markImageAsFailed = (url: string) => {
    setFailedState((current) => {
      const urls = current.key === imageCandidatesKey ? new Set(current.urls) : new Set<string>();
      urls.add(url);
      return { key: imageCandidatesKey, urls };
    });
  };
  const markImageAsLoaded = (url: string) => {
    setLoadedState((current) => {
      const urls = current.key === imageCandidatesKey ? new Set(current.urls) : new Set<string>();
      urls.add(url);
      return { key: imageCandidatesKey, urls };
    });
  };
  const shouldShowPlaceholder = !imageUrl || !loadedUrls.has(imageUrl);

  return (
    <div className={`book-cover book-cover--${size}`} aria-label={`Capa do livro ${title}`}>
      {shouldShowPlaceholder && (
        <div className="book-cover__placeholder" aria-hidden="true">
          <span className="book-cover__initials">{initials}</span>
          <span className="book-cover__title">{title}</span>
        </div>
      )}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Capa do livro ${title}`}
          loading="lazy"
          decoding="async"
          className={loadedUrls.has(imageUrl) ? "is-loaded" : undefined}
          onError={() => markImageAsFailed(imageUrl)}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth <= 2 || image.naturalHeight <= 2) {
              markImageAsFailed(imageUrl);
              return;
            }
            markImageAsLoaded(imageUrl);
          }}
        />
      )}
    </div>
  );
}
