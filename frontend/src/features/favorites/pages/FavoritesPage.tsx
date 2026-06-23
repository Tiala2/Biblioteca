import { useCallback, useEffect, useMemo, useState } from "react";
import { BookMarked, BookOpen, Eye, Heart, Library, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatBookSource, formatReadingMode } from "@shared/lib/presentation";
import { formatDateTimeBr } from "@shared/lib/formatters";

type Favorite = {
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN" | "GUTENBERG";
  createdAt: string;
};

const getFavoriteSourceDescription = (source?: Favorite["source"]) =>
  source === "OPEN" ? "Leitura externa com progresso manual" : `${formatReadingMode(true, source)} com progresso salvo`;

export function FavoritesPage() {
  const headers = useAuthHeaders();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadFavorites = useCallback(async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const response = await api.get<Favorite[]>("/api/v1/users/me/favorites", { headers });
      setFavorites(response.data);
      setError("");
    } catch (error) {
      setFavorites([]);
      setError(extractApiErrorMessage(error, "Não foi possível carregar sua estante."));
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const favoriteInsights = useMemo(() => {
    const openCount = favorites.filter((item) => item.source === "OPEN").length;
    const gutenbergCount = favorites.filter((item) => item.source === "GUTENBERG").length;
    const localCount = favorites.length - openCount - gutenbergCount;
    const latest = favorites.reduce<Favorite | null>((current, item) => {
      if (!current) return item;
      return new Date(item.createdAt).getTime() > new Date(current.createdAt).getTime() ? item : current;
    }, null);

    return { latest, gutenbergCount, localCount, openCount };
  }, [favorites]);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredFavorites = useMemo(() => {
    if (!normalizedSearch) return favorites;
    return favorites.filter((item) =>
      `${item.bookTitle} ${item.bookIsbn ?? ""} ${formatBookSource(item.source)} ${getFavoriteSourceDescription(item.source)}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [favorites, normalizedSearch]);

  const removeFavorite = async (bookId: string) => {
    if (!headers) return;
    setDeletingBookId(bookId);
    try {
      await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
      await loadFavorites();
      showToast("Livro removido da estante.", "success");
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Não foi possível remover o livro da estante."), "error");
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <section className="aura-page aura-favorites-page">
      <div className="card hero aura-hero aura-hero--favorites">
        <div>
          <p className="eyebrow aura-eyebrow">Estante afetiva</p>
          <h2>Minha Estante</h2>
          <p>Retome os livros que marcaram sua jornada e mantenha perto o que ainda merece outra página.</p>
        </div>
        <div className="aura-hero__signal">
          <Heart aria-hidden="true" />
          <strong>{favorites.length}</strong>
          <span>{favorites.length === 1 ? "livro salvo" : "livros salvos"}</span>
        </div>
      </div>

      {loading && (
        <StateCard
          title="Estante em carregamento"
          message="Estamos buscando seus livros salvos para você retomar a leitura."
          variant="loading"
        />
      )}
      {!loading && error && <StateCard title="Não foi possível carregar sua estante" message={error} variant="error" />}

      {!loading && favorites.length > 0 && (
        <article className="card aura-panel aura-panel--wide favorite-library-panel">
          <div className="section-head">
            <div>
              <h3><Library aria-hidden="true" /> Livros salvos</h3>
              <p className="section-sub">Escolha um livro salvo e volte direto para a experiência de leitura.</p>
            </div>
            <span className="kpi"><Sparkles aria-hidden="true" /> Biblioteca pessoal</span>
          </div>
          <div className="favorite-insights">
            <div className="stat-box">
              <Heart aria-hidden="true" />
              <strong>{favorites.length}</strong>
              <span>livros salvos</span>
            </div>
            <div className="stat-box">
              <Library aria-hidden="true" />
              <strong>{favoriteInsights.localCount}</strong>
              <span>leitura integrada</span>
            </div>
            <div className="stat-box">
              <Sparkles aria-hidden="true" />
              <strong>{favoriteInsights.openCount}</strong>
              <span>Open Library</span>
            </div>
            <div className="stat-box">
              <BookOpen aria-hidden="true" />
              <strong>{favoriteInsights.gutenbergCount}</strong>
              <span>Gutenberg</span>
            </div>
          </div>
          {favoriteInsights.latest && (
            <p className="favorite-latest">
              Mais recente: <strong>{favoriteInsights.latest.bookTitle}</strong>
            </p>
          )}
          <label className="field-stack favorite-search">
            <span>Buscar na estante</span>
            <input
              aria-label="Buscar livros salvos por título, ISBN ou origem"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, ISBN ou origem"
            />
          </label>
        </article>
      )}

      <div className="grid aura-book-grid favorite-book-grid">
        {filteredFavorites.map((item) => (
          <article key={item.bookId} className="card aura-book-card aura-favorite-card">
            <Link to={`/books/${item.bookId}`} className="book-cover-link" aria-label={`Abrir detalhes de ${item.bookTitle}`}>
              <BookCover title={item.bookTitle} coverUrl={item.coverUrl} isbn={item.bookIsbn} size="medium" />
            </Link>
            <div className="book-card-content">
              <div className="book-card-badges">
                <span className="import-badge">{formatBookSource(item.source)}</span>
              <span className="favorite-badge"><BookMarked aria-hidden="true" /> Na estante</span>
              </div>
              <h3>
                <Link to={`/books/${item.bookId}`} className="text-link">
                  {item.bookTitle}
                </Link>
              </h3>
              <small>{getFavoriteSourceDescription(item.source)}</small>
              <small>Salvo em {formatDateTimeBr(item.createdAt)}</small>
            </div>
            <div className="card-actions">
              <Link to={`/books/${item.bookId}`} className="btn-muted btn-link" aria-label={`Abrir detalhes de ${item.bookTitle}`}>
                <Eye aria-hidden="true" />
                Ver detalhes
              </Link>
              <Link to={`/books/${item.bookId}/read`} className="btn-link" aria-label={`Abrir ${item.bookTitle}`}>
                <BookOpen aria-hidden="true" />
                Abrir livro
              </Link>
              <button
                type="button"
                className="btn-muted btn-danger"
                aria-label={`Remover ${item.bookTitle} da estante`}
                onClick={() => removeFavorite(item.bookId)}
                disabled={deletingBookId === item.bookId}
              >
                <Trash2 aria-hidden="true" />
                {deletingBookId === item.bookId ? "Removendo..." : "Remover"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && favorites.length > 0 && filteredFavorites.length === 0 && (
        <StateCard
          title="Nenhum livro encontrado"
          message="Revise a busca para encontrar outro livro salvo na sua estante."
          action={
            <button type="button" className="btn-muted" onClick={() => setSearch("")}>
              Limpar busca
            </button>
          }
        />
      )}

      {!loading && !error && favorites.length === 0 && (
        <StateCard
          title="Nenhum livro salvo na estante"
          message="Explore os livros e salve aqueles que você quer retomar com rapidez."
          action={
            <Link to="/books" className="btn-link">
              Explorar livros
            </Link>
          }
        />
      )}
    </section>
  );
}
