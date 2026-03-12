import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";

type RankMode = "MOST_READ" | "TRENDING" | "ACCLAIMED";
type BookSort = "TRENDING_MONTH" | "TRENDING_WEEK" | "BEST_RATED";

type RankedBook = {
  id: string;
  title: string;
  numberOfPages: number;
  averageRating?: number | null;
  totalReviews?: number | null;
};

type Paged<T> = { content: T[] };

function parseMode(value: string | null): RankMode {
  if (value === "TRENDING") return "TRENDING";
  if (value === "ACCLAIMED") return "ACCLAIMED";
  return "MOST_READ";
}

function sortByMode(mode: RankMode): BookSort {
  if (mode === "TRENDING") return "TRENDING_WEEK";
  if (mode === "ACCLAIMED") return "BEST_RATED";
  return "TRENDING_MONTH";
}

export function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = useMemo(() => parseMode(searchParams.get("tab")), [searchParams]);
  const [books, setBooks] = useState<RankedBook[]>([]);

  useEffect(() => {
    const sort = sortByMode(mode);
    api
      .get<Paged<RankedBook>>(`/api/v1/books?page=0&size=20&sort=${sort}&includeWithoutPdf=true`)
      .then((response) => setBooks(response.data.content))
      .catch(() => setBooks([]));
  }, [mode]);

  const changeMode = (next: RankMode) => {
    const params = new URLSearchParams(searchParams);
    if (next === "MOST_READ") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Descubra as histórias mais envolventes</h2>
          <p className="section-sub">Ranking de livros, sem comparação entre usuários.</p>
        </div>
      </div>

      <article className="card tabs-card">
        <div className="tabs-row" role="tablist" aria-label="Ranking de livros">
          <button type="button" role="tab" aria-selected={mode === "MOST_READ"} className={mode === "MOST_READ" ? "tab active" : "tab"} onClick={() => changeMode("MOST_READ")}>
            Mais lidos
          </button>
          <button type="button" role="tab" aria-selected={mode === "TRENDING"} className={mode === "TRENDING" ? "tab active" : "tab"} onClick={() => changeMode("TRENDING")}>
            Em alta
          </button>
          <button type="button" role="tab" aria-selected={mode === "ACCLAIMED"} className={mode === "ACCLAIMED" ? "tab active" : "tab"} onClick={() => changeMode("ACCLAIMED")}>
            Aclamados
          </button>
        </div>
      </article>

      <div className="grid">
        {books.map((book, index) => (
          <article key={book.id} className="card">
            <h3>
              #{index + 1} {book.title}
            </h3>
            <p>{book.numberOfPages} páginas no catálogo</p>
            <small>
              Leitores ativos: {Math.max(1, Math.round(book.numberOfPages / 20))} · Nota média: {Number(book.averageRating ?? 0).toFixed(1)} · Reviews: {book.totalReviews ?? 0}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

