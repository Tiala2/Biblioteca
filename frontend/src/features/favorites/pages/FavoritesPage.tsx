import { useCallback, useEffect, useState } from "react";
import { BookMarked, Heart, Library, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";

type Favorite = {
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
  createdAt: string;
};

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

  const removeFavorite = async (bookId: string) => {
    if (!headers) return;
    setDeletingBookId(bookId);
    try {
      await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
      await loadFavorites();
      showToast("Favorito removido com sucesso.", "success");
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Falha ao remover favorito."), "error");
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <section className="aura-page">
      <div className="card hero aura-hero aura-hero--favorites">
        <div>
          <p className="eyebrow aura-eyebrow">Estante afetiva</p>
          <h2>Seus capitulos preferidos continuam aqui</h2>
          <p>Retome os livros que marcaram sua jornada e mantenha perto o que ainda merece outra página.</p>
        </div>
        <div className="aura-hero__signal">
          <Heart aria-hidden="true" />
          <strong>{favorites.length}</strong>
          <span>favorito(s)</span>
        </div>
      </div>

      {loading && (
        <StateCard
          title="Favoritos em carregamento"
          message="Estamos buscando sua biblioteca pessoal para você retomar a leitura."
          variant="loading"
        />
      )}
      {!loading && error && <StateCard title="Falha ao carregar favoritos" message={error} variant="error" />}

      {!loading && favorites.length > 0 && (
        <article className="card aura-panel aura-panel--wide">
          <div className="section-head">
            <div>
              <h3><Library aria-hidden="true" /> Prontos para reabrir</h3>
              <p className="section-sub">Escolha um favorito e volte direto para a experiencia de leitura.</p>
            </div>
            <span className="kpi"><Sparkles aria-hidden="true" /> Biblioteca pessoal</span>
          </div>
        </article>
      )}

      <div className="grid aura-book-grid">
        {favorites.map((item) => (
          <article key={item.bookId} className="card aura-book-card aura-favorite-card">
            <BookCover title={item.bookTitle} coverUrl={item.coverUrl} size="medium" />
            <div className="book-card-badges">
              {item.source === "OPEN" && <span className="import-badge">OPEN LIBRARY</span>}
              <span className="favorite-badge"><BookMarked aria-hidden="true" /> FAVORITO</span>
            </div>
            <h3>{item.bookTitle}</h3>
            <p>ISBN: {item.bookIsbn}</p>
            {item.source === "OPEN" && <small>Leitura externa com progresso manual</small>}
            <small>Favoritado em: {new Date(item.createdAt).toLocaleString()}</small>
            <div className="card-actions">
              <Link to={`/books/${item.bookId}`} className="btn-muted btn-link">
                Ver detalhes
              </Link>
              <Link to={`/books/${item.bookId}/read`} className="btn-link">
                Ler agora
              </Link>
              <button
                type="button"
                className="btn-muted"
                aria-label={`Remover ${item.bookTitle} dos favoritos`}
                onClick={() => removeFavorite(item.bookId)}
                disabled={deletingBookId === item.bookId}
              >
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
