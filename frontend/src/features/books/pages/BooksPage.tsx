import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Filter, Search, Sparkles, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@shared/ui/toast/ToastContext";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };
type Book = {
  id: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  numberOfPages: number;
  hasPdf: boolean;
  source?: "LOCAL" | "OPEN";
  coverUrl?: string | null;
};
type Paged<T> = { content: T[]; page: { size: number; number: number; totalElements: number; totalPages: number } };
type BookSort = "TRENDING_WEEK" | "TRENDING_MONTH" | "BEST_RATED" | "NEW_RELEASES";
type Favorite = { bookId: string };
type ActiveFilterKey = "query" | "author" | "categoryId" | "tagId" | "minPages" | "maxPages" | "sort" | "withPdf";

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

function formatSort(sort: BookSort): string {
  const labels: Record<BookSort, string> = {
    BEST_RATED: "Melhor avaliacao",
    NEW_RELEASES: "Lancamentos",
    TRENDING_WEEK: "Tendencia semanal",
    TRENDING_MONTH: "Tendencia mensal",
  };
  return labels[sort];
}

export function BooksPage() {
  const { showToast } = useToast();
  const headers = useAuthHeaders();
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
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: ActiveFilterKey; label: string }> = [];
    const selectedCategory = categories.find((category) => category.id === applied.categoryId);
    const selectedTag = tags.find((tag) => tag.id === applied.tagId);

    if (applied.query) filters.push({ key: "query", label: `Busca: ${applied.query}` });
    if (applied.author) filters.push({ key: "author", label: `Autor: ${applied.author}` });
    if (applied.categoryId) filters.push({ key: "categoryId", label: `Categoria: ${selectedCategory?.name ?? "selecionada"}` });
    if (applied.tagId) filters.push({ key: "tagId", label: `Tag: ${selectedTag?.name ?? "selecionada"}` });
    if (applied.minPages) filters.push({ key: "minPages", label: `Minimo: ${applied.minPages} paginas` });
    if (applied.maxPages) filters.push({ key: "maxPages", label: `Maximo: ${applied.maxPages} paginas` });
    if (applied.sort !== DEFAULT_SORT) filters.push({ key: "sort", label: `Ordem: ${formatSort(applied.sort)}` });
    if (applied.onlyWithPdf) filters.push({ key: "withPdf", label: "Somente com PDF" });

    return filters;
  }, [applied, categories, tags]);
  const catalogInsights = useMemo(() => {
    const openCount = books.filter((book) => book.source === "OPEN").length;
    const pdfCount = books.filter((book) => book.hasPdf).length;
    const favoriteCount = books.filter((book) => favoriteBookIds.has(book.id)).length;
    const totalPagesVisible = books.reduce((total, book) => total + Number(book.numberOfPages || 0), 0);

    return {
      averagePages: books.length > 0 ? Math.round(totalPagesVisible / books.length) : 0,
      favoriteCount,
      localCount: books.length - openCount,
      openCount,
      pdfCount,
      totalPagesVisible,
    };
  }, [books, favoriteBookIds]);

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
      } catch (error) {
        setBooks([]);
        setTotalPages(0);
        setError(extractApiErrorMessage(error, "Não foi possível carregar livros no momento."));
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

  const removeFilter = (key: ActiveFilterKey) => {
    if (key === "query") updateUrl({ query: "", page: 0 });
    if (key === "author") updateUrl({ author: "", page: 0 });
    if (key === "categoryId") updateUrl({ categoryId: "", page: 0 });
    if (key === "tagId") updateUrl({ tagId: "", page: 0 });
    if (key === "minPages") updateUrl({ minPages: "", page: 0 });
    if (key === "maxPages") updateUrl({ maxPages: "", page: 0 });
    if (key === "sort") updateUrl({ sort: DEFAULT_SORT, page: 0 });
    if (key === "withPdf") updateUrl({ withPdf: false, page: 0 });
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
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Não foi possível atualizar favorito."), "error");
    } finally {
      setFavoriteLoadingBookId(null);
    }
  };

  return (
    <section className="aura-page">
      <div className="card hero aura-hero aura-hero--catalog">
        <div>
          <p className="eyebrow aura-eyebrow">Vitrine viva</p>
          <h2>Escolha sua próxima jornada</h2>
          <p>Explore livros locais e descobertas importadas com filtros rápidos, favoritos e leitura guiada.</p>
        </div>
        <div className="aura-hero__signal">
          <Sparkles aria-hidden="true" />
          <strong>{books.length}</strong>
          <span>nesta página</span>
        </div>
      </div>

      <article className="card aura-panel aura-filter-panel">
        <div className="section-head">
          <h3><Filter aria-hidden="true" /> Afinar descoberta</h3>
          <span className="kpi">{formatSort(applied.sort)}</span>
        </div>
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
            aria-label="Quantidade mínima de páginas"
            type="number"
            min={1}
            placeholder="Mín. páginas"
            value={minPagesInput}
            onChange={(event) => setMinPagesInput(event.target.value)}
          />
          <input
            aria-label="Quantidade máxima de páginas"
            type="number"
            min={1}
            placeholder="Máx. páginas"
            value={maxPagesInput}
            onChange={(event) => setMaxPagesInput(event.target.value)}
          />
          <select aria-label="Ordenação do catálogo" value={sortInput} onChange={(event) => onSortChange(event.target.value as BookSort)}>
            <option value="BEST_RATED">Melhor avaliação</option>
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
            <button type="submit">
              <Search aria-hidden="true" />
              Pesquisar
            </button>
            <button type="button" className="btn-muted" onClick={clearFilters}>
              Limpar
            </button>
          </div>
        </form>
        {activeFilters.length > 0 && (
          <div className="active-filters" aria-label="Filtros aplicados">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className="filter-chip"
                aria-label={`Remover filtro ${filter.label}`}
                onClick={() => removeFilter(filter.key)}
              >
                <span>{filter.label}</span>
                <X aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="filter-chip filter-chip--clear" onClick={clearFilters}>
              Limpar tudo
            </button>
          </div>
        )}
      </article>

      {loading && (
        <StateCard
          title="Catálogo em carregamento"
          message="Estamos reunindo livros, filtros e destaques para sua próxima leitura."
          variant="loading"
        />
      )}
      {!loading && error && <StateCard title="Falha ao carregar catálogo" message={error} variant="error" />}

      {!loading && !error && books.length > 0 && (
        <article className="card aura-panel aura-panel--wide">
          <div className="section-head">
            <div>
              <h3>Resumo da vitrine</h3>
              <p className="section-sub">Uma leitura rapida do resultado atual antes de escolher o proximo livro.</p>
            </div>
            <span className="kpi">Pagina {applied.page + 1}</span>
          </div>
          <div className="catalog-insights">
            <div className="stat-box">
              <strong>{books.length}</strong>
              <span>livros nesta pagina</span>
            </div>
            <div className="stat-box">
              <strong>{catalogInsights.pdfCount}</strong>
              <span>com PDF</span>
            </div>
            <div className="stat-box">
              <strong>{catalogInsights.openCount}</strong>
              <span>Open Library</span>
            </div>
            <div className="stat-box">
              <strong>{catalogInsights.localCount}</strong>
              <span>catálogo local</span>
            </div>
            <div className="stat-box">
              <strong>{catalogInsights.favoriteCount}</strong>
              <span>favoritos</span>
            </div>
            <div className="stat-box">
              <strong>{catalogInsights.averagePages}</strong>
              <span>média de páginas</span>
            </div>
          </div>
          <p className="catalog-total-pages">
            Total visível: <strong>{catalogInsights.totalPagesVisible}</strong> páginas somadas nesta página.
          </p>
        </article>
      )}

      {!loading && !error && <div className="grid aura-catalog-grid">
        {books.map((book) => (
          <article key={book.id} className="card aura-book-card">
            <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="medium" />
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
            <p>{book.author || "Autor não informado"}</p>
            <p>{book.numberOfPages} páginas</p>
            <small>
              {book.hasPdf
                ? "PDF disponível"
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
                aria-pressed={favoriteBookIds.has(book.id)}
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
        <button
          type="button"
          className="btn-muted"
          aria-label="Ir para a página anterior do catálogo"
          disabled={applied.page <= 0 || loading}
          onClick={() => goToPage(applied.page - 1)}
        >
          Anterior
        </button>
        <span className="section-sub">
          Página {applied.page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn-muted"
          aria-label="Ir para a próxima página do catálogo"
          disabled={loading || applied.page + 1 >= Math.max(totalPages, 1)}
          onClick={() => goToPage(applied.page + 1)}
        >
          Próxima
        </button>
      </div>

      {!loading && !error && books.length === 0 && (
        <StateCard
          title="Nenhum livro encontrado"
          message="Ajuste os filtros ou limpe a busca para explorar outras combinações do catálogo."
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
