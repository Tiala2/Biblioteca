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
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const imageUrl = imageCandidates.find((candidate) => !failedUrls.has(candidate)) ?? null;

  return (
    <div className={`book-cover book-cover--${size}`} aria-label={`Capa do livro ${title}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Capa do livro ${title}`}
          loading="lazy"
          onError={() => setFailedUrls((current) => new Set(current).add(imageUrl))}
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
