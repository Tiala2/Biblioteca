type BookCoverProps = {
  title: string;
  coverUrl?: string | null;
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

export function BookCover({ title, coverUrl, size = "medium" }: BookCoverProps) {
  const initials = buildInitials(title);

  return (
    <div className={`book-cover book-cover--${size}`} aria-label={`Capa do livro ${title}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={`Capa do livro ${title}`} loading="lazy" />
      ) : (
        <div className="book-cover__placeholder" aria-hidden="true">
          <span className="book-cover__initials">{initials}</span>
          <span className="book-cover__title">{title}</span>
        </div>
      )}
    </div>
  );
}
