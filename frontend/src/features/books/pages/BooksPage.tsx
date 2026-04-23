import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";
import { api } from "@shared/api/http";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };
type Book = {
  id: string;
  title: string;
  author?: string | null;
  numberOfPages: number;
  hasPdf: boolean;
  source?: "LOCAL" | "OPEN";
  coverUrl?: string | null;
};
type Paged<T> = { content: T[]; page: { size: number; number: number; totalElements: number; totalPages: number } };
type BookSort = "TRENDING_WEEK" | "TRENDING_MONTH" | "BEST_RATED" | "NEW_RELEASES";
type Favorite = { bookId: string };

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
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set());
  const [totalPages, setTotalPages] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [minPagesInput, setMinPagesInput] = useState("");
  const [maxPagesInput, setMaxPagesInput] = useState("");
  const [sortInput, setSortInput] = useState<BookSort>(DEFAULT_SORT);
  const [onlyWithPdfInput, setOnlyWithPdfInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteLoadingBookId, setFavoriteLoadingBookId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const headers = auth ? { Authorization: `Bearer ${auth.token}` } : undefined;

  const applied = useMemo(() => {
    return {
      query: searchParams.get("q") ?? "",
      author: searchParams.get("author") ?? "",
      categoryId: searchParams.get("categoryId") ?? "",
      tagId: searchParams.get("tagId") ?? "",
      minPages: parsePositiveInt(searchParams.get("minPages")),
      maxPages: parsePositiveInt(searchParams.get("maxPages")),
      sort: parseSort(searchParams.get("sort")),
      onlyWithPdf: searchParams.get("withPdf") === "1",
      page: parsePage(searchParams.get("page")),
    };
  }, [searchParams]);

  useEffect(() => {
    setQueryInput(applied.query);
    setAuthorInput(applied.author);
    setSelectedCategoryId(applied.categoryId);
    setSelectedTagId(applied.tagId);
    setMinPagesInput(applied.minPages ? String(applied.minPages) : "");
    setMaxPagesInput(applied.maxPages ? String(applied.maxPages) : "");
    setSortInput(applied.sort);
    setOnlyWithPdfInput(applied.onlyWithPdf);
  }, [applied]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryResponse, tagResponse] = await Promise.all([
          api.get<Category[]>("/api/v1/categories"),
          api.get<Tag[]>("/api/v1/tags"),
        ]);
        setCategories(categoryResponse.data);
        setTags(tagResponse.data);
      } catch {
        setCategories([]);
        setTags([]);
      }
    };

    void loadFilters();
  }, []);

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
            author: applied.author || undefined,
            categoryIds: applied.categoryId || undefined,
            tagIds: applied.tagId || undefined,
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

  useEffect(() => {
    if (!headers) return;

    const loadFavorites = async () => {
      try {
        const response = await api.get<Favorite[]>("/api/v1/users/me/favorites", { headers });
        setFavoriteBookIds(new Set(response.data.map((item) => item.bookId)));
      } catch {
        setFavoriteBookIds(new Set());
      }
    };

    void loadFavorites();
  }, [headers]);

  const updateUrl = (
    next: Partial<{
      query: string;
      author: string;
      categoryId: string;
      tagId: string;
      minPages: string;
      maxPages: string;
      sort: BookSort;
      withPdf: boolean;
      page: number;
    }>
  ) => {
    const nextQuery = next.query ?? queryInput.trim();
    const nextAuthor = next.author ?? authorInput.trim();
    const nextCategoryId = next.categoryId ?? selectedCategoryId;
    const nextTagId = next.tagId ?? selectedTagId;
    const nextMin = next.minPages ?? minPagesInput.trim();
    const nextMax = next.maxPages ?? maxPagesInput.trim();
    const nextSort = next.sort ?? sortInput;
    const nextWithPdf = next.withPdf ?? onlyWithPdfInput;
    const nextPage = next.page ?? applied.page;

    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextAuthor) params.set("author", nextAuthor);
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (nextTagId) params.set("tagId", nextTagId);
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
    setAuthorInput("");
    setSelectedCategoryId("");
    setSelectedTagId("");
    setMinPagesInput("");
    setMaxPagesInput("");
    setSortInput(DEFAULT_SORT);
    setOnlyWithPdfInput(false);
    setSearchParams({}, { replace: true });
  };

  const toggleFavorite = async (bookId: string) => {
    if (!headers) return;

    const isFavorite = favoriteBookIds.has(bookId);
    setFavoriteLoadingBookId(bookId);
    try {
      if (isFavorite) {
        await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
        setFavoriteBookIds((previous) => {
          const next = new Set(previous);
          next.delete(bookId);
          return next;
        });
        showToast("Livro removido dos favoritos.", "success");
      } else {
        await api.post(
          "/api/v1/users/me/favorites",
          { bookId },
          { headers }
        );
        setFavoriteBookIds((previous) => new Set(previous).add(bookId));
        showToast("Livro adicionado aos favoritos.", "success");
      }
    } catch {
      showToast("Nao foi possivel atualizar favorito.", "error");
    } finally {
      setFavoriteLoadingBookId(null);
    }
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Escolha sua proxima jornada</h2>
          <p className="section-sub">Busque livros do acervo local e importado em tempo real.</p>
        </div>
        <span className="kpi">{books.length} nesta pagina</span>
      </div>

      <article className="card">
        <form className="filters-grid" onSubmit={onSearch}>
          <input
            aria-label="Pesquisar livros por titulo ou autor"
            placeholder="Pesquisar por titulo ou autor"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
          />
          <input
            aria-label="Filtrar livros por autor"
            placeholder="Filtrar por autor"
            value={authorInput}
            onChange={(event) => setAuthorInput(event.target.value)}
          />
          <select aria-label="Filtrar por categoria" value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select aria-label="Filtrar por tag" value={selectedTagId} onChange={(event) => setSelectedTagId(event.target.value)}>
            <option value="">Todas as tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <input
            aria-label="Quantidade minima de paginas"
            type="number"
            min={1}
            placeholder="Min paginas"
            value={minPagesInput}
            onChange={(event) => setMinPagesInput(event.target.value)}
          />
          <input
            aria-label="Quantidade maxima de paginas"
            type="number"
            min={1}
            placeholder="Max paginas"
            value={maxPagesInput}
            onChange={(event) => setMaxPagesInput(event.target.value)}
          />
          <select aria-label="Ordenacao do catalogo" value={sortInput} onChange={(event) => onSortChange(event.target.value as BookSort)}>
            <option value="BEST_RATED">Melhor avaliacao</option>
            <option value="NEW_RELEASES">Lancamentos</option>
            <option value="TRENDING_WEEK">Tendencia semanal</option>
            <option value="TRENDING_MONTH">Tendencia mensal</option>
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

      {loading && (
        <StateCard
          title="Catalogo em carregamento"
          message="Estamos reunindo livros, filtros e destaques para sua proxima leitura."
          variant="loading"
        />
      )}
      {!loading && error && <StateCard title="Falha ao carregar catalogo" message={error} variant="error" />}

      {!loading && !error && <div className="grid">
        {books.map((book) => (
          <article key={book.id} className="card">
            <BookCover title={book.title} coverUrl={book.coverUrl} size="medium" />
            <div className="book-card-badges">
              {book.source === "OPEN" && <span className="import-badge">OPEN LIBRARY</span>}
              {!book.hasPdf && book.source !== "OPEN" && <span className="import-badge">SEM PDF</span>}
              {favoriteBookIds.has(book.id) && <span className="favorite-badge">FAVORITO</span>}
            </div>
            <h3>
              <Link to={`/books/${book.id}`} className="btn-link">
                {book.title}
              </Link>
            </h3>
            <p>{book.author || "Autor nao informado"}</p>
            <p>{book.numberOfPages} paginas</p>
            <small>
              {book.hasPdf
                ? "PDF disponivel"
                : book.source === "OPEN"
                  ? "Leitura externa com progresso manual"
                  : "Sem PDF local"}
            </small>
            <div className="card-actions">
              <Link to={`/books/${book.id}`} className="btn-muted btn-link">
                Ver detalhes
              </Link>
              <Link
                to={`/books/${book.id}/read`}
                className={book.hasPdf ? "btn-link" : "btn-muted btn-link"}
              >
                {book.hasPdf ? "Ler no app" : "Ler com progresso"}
              </Link>
              <button
                type="button"
                className={favoriteBookIds.has(book.id) ? "favorite-toggle active" : "favorite-toggle"}
                onClick={() => toggleFavorite(book.id)}
                disabled={favoriteLoadingBookId === book.id}
              >
                {favoriteLoadingBookId === book.id
                  ? "Salvando..."
                  : favoriteBookIds.has(book.id)
                    ? "Nos favoritos"
                    : "Salvar nos favoritos"}
              </button>
            </div>
          </article>
        ))}
      </div>}

      <div className="pagination-row">
        <button className="btn-muted" disabled={applied.page <= 0 || loading} onClick={() => goToPage(applied.page - 1)}>
          Anterior
        </button>
        <span className="section-sub">
          Pagina {applied.page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          className="btn-muted"
          disabled={loading || applied.page + 1 >= Math.max(totalPages, 1)}
          onClick={() => goToPage(applied.page + 1)}
        >
          Proxima
        </button>
      </div>

      {!loading && !error && books.length === 0 && (
        <StateCard
          title="Nenhum livro encontrado"
          message="Ajuste os filtros ou limpe a busca para explorar outras combinacoes do catalogo."
          action={
            <button type="button" className="btn-muted" onClick={clearFilters}>
              Limpar filtros
            </button>
          }
        />
      )}
    </section>
  );
}
