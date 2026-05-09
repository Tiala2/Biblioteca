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

export function BookCover({ title, coverUrl, isbn, size = "medium" }: BookCoverProps) {
  const initials = buildInitials(title);
  const imageCandidates = useMemo(() => {
    const candidates = [];
    if (coverUrl?.trim()) candidates.push(coverUrl.trim());

    const cleanIsbn = normalizeIsbn(isbn);
    if (cleanIsbn) candidates.push(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`);

    return Array.from(new Set(candidates));
  }, [coverUrl, isbn]);
  const imageCandidatesKey = imageCandidates.join("|");
  const [failedState, setFailedState] = useState<{ key: string; urls: Set<string> }>(() => ({
    key: "",
    urls: new Set(),
  }));
  const failedUrls = failedState.key === imageCandidatesKey ? failedState.urls : new Set<string>();
  const imageUrl = imageCandidates.find((candidate) => !failedUrls.has(candidate)) ?? null;
  const markImageAsFailed = (url: string) => {
    setFailedState((current) => {
      const urls = current.key === imageCandidatesKey ? new Set(current.urls) : new Set<string>();
      urls.add(url);
      return { key: imageCandidatesKey, urls };
    });
  };

  return (
    <div className={`book-cover book-cover--${size}`} aria-label={`Capa do livro ${title}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Capa do livro ${title}`}
          loading="lazy"
          decoding="async"
          onError={() => markImageAsFailed(imageUrl)}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth <= 2 || image.naturalHeight <= 2) {
              markImageAsFailed(imageUrl);
            }
          }}
        />
      ) : (
        <div className="book-cover__placeholder" aria-hidden="true">
          <span className="book-cover__initials">{initials}</span>
          <span className="book-cover__title">{title}</span>
        </div>
      )}
    </div>
  );
}
