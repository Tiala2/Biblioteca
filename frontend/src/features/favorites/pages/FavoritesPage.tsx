import { useCallback, useEffect, useMemo, useState } from "react";
import { BookMarked, BookOpen, Eye, Heart, Library, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatBookSource } from "@shared/lib/presentation";
import { formatDateTimeBr } from "@shared/lib/formatters";

type Favorite = {
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
  createdAt: string;
};

const getFavoriteSourceDescription = (source?: Favorite["source"]) =>
  source === "OPEN" ? "Leitura externa com progresso manual" : "Leitura local no app";

export function FavoritesPage() {
  const headers = useAuthHeaders();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
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
      setError(extractApiErrorMessage(error, "Não foi possível carregar favoritos."));
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const favoriteInsights = useMemo(() => {
    const openCount = favorites.filter((item) => item.source === "OPEN").length;
    const localCount = favorites.length - openCount;
    const latest = favorites.reduce<Favorite | null>((current, item) => {
      if (!current) return item;
      return new Date(item.createdAt).getTime() > new Date(current.createdAt).getTime() ? item : current;
    }, null);

    return { latest, localCount, openCount };
  }, [favorites]);

  const removeFavorite = async (bookId: string) => {
    if (!headers) return;
    setDeletingBookId(bookId);
    try {
      await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
      await loadFavorites();
      showToast("Favorito removido com sucesso.", "success");
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Não foi possível remover o favorito."), "error");
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <section className="aura-page">
      <div className="card hero aura-hero aura-hero--favorites">
        <div>
          <p className="eyebrow aura-eyebrow">Estante afetiva</p>
          <h2>Seus capítulos preferidos continuam aqui</h2>
          <p>Retome os livros que marcaram sua jornada e mantenha perto o que ainda merece outra página.</p>
        </div>
        <div className="aura-hero__signal">
          <Heart aria-hidden="true" />
          <strong>{favorites.length}</strong>
          <span>{favorites.length === 1 ? "favorito" : "favoritos"}</span>
        </div>
      </div>

      {loading && (
        <StateCard
          title="Favoritos em carregamento"
          message="Estamos buscando sua biblioteca pessoal para você retomar a leitura."
          variant="loading"
        />
      )}
      {!loading && error && <StateCard title="Não foi possível carregar favoritos" message={error} variant="error" />}

      {!loading && favorites.length > 0 && (
        <article className="card aura-panel aura-panel--wide">
          <div className="section-head">
            <div>
              <h3><Library aria-hidden="true" /> Prontos para reabrir</h3>
              <p className="section-sub">Escolha um favorito e volte direto para a experiência de leitura.</p>
            </div>
            <span className="kpi"><Sparkles aria-hidden="true" /> Biblioteca pessoal</span>
          </div>
          <div className="favorite-insights">
            <div className="stat-box">
              <Heart aria-hidden="true" />
              <strong>{favorites.length}</strong>
              <span>favoritos salvos</span>
            </div>
            <div className="stat-box">
              <Library aria-hidden="true" />
              <strong>{favoriteInsights.localCount}</strong>
              <span>leitura no app</span>
            </div>
            <div className="stat-box">
              <Sparkles aria-hidden="true" />
              <strong>{favoriteInsights.openCount}</strong>
              <span>Open Library</span>
            </div>
          </div>
          {favoriteInsights.latest && (
            <p className="favorite-latest">
              Mais recente: <strong>{favoriteInsights.latest.bookTitle}</strong>
            </p>
          )}
        </article>
      )}

      <div className="grid aura-book-grid">
        {favorites.map((item) => (
          <article key={item.bookId} className="card aura-book-card aura-favorite-card">
            <BookCover title={item.bookTitle} coverUrl={item.coverUrl} isbn={item.bookIsbn} size="medium" />
            <div className="book-card-badges">
              <span className="import-badge">{formatBookSource(item.source)}</span>
              <span className="favorite-badge"><BookMarked aria-hidden="true" /> Favorito</span>
            </div>
            <h3>{item.bookTitle}</h3>
            <p>ISBN {item.bookIsbn}</p>
            <small>{getFavoriteSourceDescription(item.source)}</small>
            <small>Favoritado em {formatDateTimeBr(item.createdAt)}</small>
            <div className="card-actions">
              <Link to={`/books/${item.bookId}`} className="btn-muted btn-link">
                <Eye aria-hidden="true" />
                Ver detalhes
              </Link>
              <Link to={`/books/${item.bookId}/read`} className="btn-link">
                <BookOpen aria-hidden="true" />
                Ler agora
              </Link>
              <button
                type="button"
                className="btn-muted btn-danger"
                aria-label={`Remover ${item.bookTitle} dos favoritos`}
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

      {!loading && !error && favorites.length === 0 && (
        <StateCard
          title="Nenhum favorito salvo"
          message="Explore o catálogo e marque os livros que você quer retomar com rapidez."
          action={
            <Link to="/books" className="btn-link">
              Explorar catálogo
            </Link>
          }
        />
      )}
    </section>
  );
}
