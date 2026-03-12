import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";

type Book = { id: string; title: string; numberOfPages: number; hasPdf: boolean };
type Paged<T> = { content: T[]; page: { size: number; number: number; totalElements: number; totalPages: number } };
type BookSort = "TRENDING_WEEK" | "TRENDING_MONTH" | "BEST_RATED" | "NEW_RELEASES";

const DEFAULT_SORT: BookSort = "BEST_RATED";
const PAGE_SIZE = 12;

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return parsed;
}

function parseSort(value: string | null): BookSort {
  if (value === "TRENDING_WEEK") return "TRENDING_WEEK";
  if (value === "TRENDING_MONTH") return "TRENDING_MONTH";
  if (value === "NEW_RELEASES") return "NEW_RELEASES";
  return "BEST_RATED";
}

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [minPagesInput, setMinPagesInput] = useState("");
  const [maxPagesInput, setMaxPagesInput] = useState("");
  const [sortInput, setSortInput] = useState<BookSort>(DEFAULT_SORT);
  const [onlyWithPdfInput, setOnlyWithPdfInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const applied = useMemo(() => {
    return {
      query: searchParams.get("q") ?? "",
      minPages: parsePositiveInt(searchParams.get("minPages")),
      maxPages: parsePositiveInt(searchParams.get("maxPages")),
      sort: parseSort(searchParams.get("sort")),
      onlyWithPdf: searchParams.get("withPdf") === "1",
      page: parsePage(searchParams.get("page")),
    };
  }, [searchParams]);

  useEffect(() => {
    setQueryInput(applied.query);
    setMinPagesInput(applied.minPages ? String(applied.minPages) : "");
    setMaxPagesInput(applied.maxPages ? String(applied.maxPages) : "");
    setSortInput(applied.sort);
    setOnlyWithPdfInput(applied.onlyWithPdf);
  }, [applied]);

  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      try {
        const response = await api.get<Paged<Book>>("/api/v1/books", {
          params: {
            page: applied.page,
            size: PAGE_SIZE,
            includeWithoutPdf: !applied.onlyWithPdf,
            q: applied.query || undefined,
            minPages: applied.minPages,
            maxPages: applied.maxPages,
            sort: applied.sort,
          },
        });
        setBooks(response.data.content);
        setTotalPages(response.data.page.totalPages);
        setError("");
      } catch {
        setBooks([]);
        setTotalPages(0);
        setError("Nao foi possivel carregar livros no momento.");
      } finally {
        setLoading(false);
      }
    };

    void loadBooks();
  }, [applied]);

  const updateUrl = (
    next: Partial<{
      query: string;
      minPages: string;
      maxPages: string;
      sort: BookSort;
      withPdf: boolean;
      page: number;
    }>
  ) => {
    const nextQuery = next.query ?? queryInput.trim();
    const nextMin = next.minPages ?? minPagesInput.trim();
    const nextMax = next.maxPages ?? maxPagesInput.trim();
    const nextSort = next.sort ?? sortInput;
    const nextWithPdf = next.withPdf ?? onlyWithPdfInput;
    const nextPage = next.page ?? applied.page;

    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextMin) params.set("minPages", nextMin);
    if (nextMax) params.set("maxPages", nextMax);
    if (nextSort !== DEFAULT_SORT) params.set("sort", nextSort);
    if (nextWithPdf) params.set("withPdf", "1");
    if (nextPage > 0) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    updateUrl({ page: 0 });
  };

  const onSortChange = (value: BookSort) => {
    setSortInput(value);
    updateUrl({ sort: value, page: 0 });
  };

  const onWithPdfChange = (checked: boolean) => {
    setOnlyWithPdfInput(checked);
    updateUrl({ withPdf: checked, page: 0 });
  };

  const goToPage = (nextPage: number) => {
    updateUrl({ page: nextPage });
  };

  const clearFilters = () => {
    setQueryInput("");
    setMinPagesInput("");
    setMaxPagesInput("");
    setSortInput(DEFAULT_SORT);
    setOnlyWithPdfInput(false);
    setSearchParams({}, { replace: true });
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Escolha sua próxima jornada</h2>
          <p className="section-sub">Busque livros do acervo local e importado da Open Library em tempo real.</p>
        </div>
        <span className="kpi">{books.length} nesta pagina</span>
      </div>

      <article className="card">
        <form className="filters-grid" onSubmit={onSearch}>
          <input
            placeholder="Pesquisar por título (ex: Hobbit, Duna, Clean Code)"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
          />
          <input
            type="number"
            min={1}
            placeholder="Mín páginas"
            value={minPagesInput}
            onChange={(event) => setMinPagesInput(event.target.value)}
          />
          <input
            type="number"
            min={1}
            placeholder="Máx páginas"
            value={maxPagesInput}
            onChange={(event) => setMaxPagesInput(event.target.value)}
          />
          <select value={sortInput} onChange={(event) => onSortChange(event.target.value as BookSort)}>
            <option value="BEST_RATED">Melhor avaliação</option>
            <option value="NEW_RELEASES">Lançamentos</option>
            <option value="TRENDING_WEEK">Tendência semanal</option>
            <option value="TRENDING_MONTH">Tendência mensal</option>
          </select>
          <label className="check-inline">
            <input
              type="checkbox"
              checked={onlyWithPdfInput}
              onChange={(event) => onWithPdfChange(event.target.checked)}
            />
            Apenas com PDF
          </label>
          <div className="filter-actions">
            <button type="submit">Pesquisar</button>
            <button type="button" className="btn-muted" onClick={clearFilters}>
              Limpar
            </button>
          </div>
        </form>
      </article>

      {loading && <p className="section-sub">Carregando livros...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {books.map((book) => (
          <article key={book.id} className="card">
            {!book.hasPdf && <span className="import-badge">IMPORTADO</span>}
            <h3>{book.title}</h3>
            <p>{book.numberOfPages} páginas</p>
            <small>{book.hasPdf ? "PDF disponível" : "Sem PDF (metadado importado)"}</small>
            <div className="card-actions">
              {book.hasPdf ? (
                <Link to={`/books/${book.id}/read`} className="btn-link">
                  Ler no app
                </Link>
              ) : (
                <Link to={`/books/${book.id}/read`} className="btn-muted btn-link">
                  Ler no app
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="pagination-row">
        <button className="btn-muted" disabled={applied.page <= 0 || loading} onClick={() => goToPage(applied.page - 1)}>
          Anterior
        </button>
        <span className="section-sub">
          Página {applied.page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          className="btn-muted"
          disabled={loading || applied.page + 1 >= Math.max(totalPages, 1)}
          onClick={() => goToPage(applied.page + 1)}
        >
          Próxima
        </button>
      </div>

      {!loading && books.length === 0 && (
        <p className="section-sub">Nenhum livro encontrado para a busca informada.</p>
      )}
    </section>
  );
}

