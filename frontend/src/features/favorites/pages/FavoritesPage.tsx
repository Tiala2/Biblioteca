import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";
import { BookCover } from "@shared/ui/books/BookCover";

type Favorite = {
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
  createdAt: string;
};

export function FavoritesPage() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const headers = auth ? { Authorization: `Bearer ${auth.token}` } : undefined;

  const loadFavorites = async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const response = await api.get<Favorite[]>("/api/v1/users/me/favorites", { headers });
      setFavorites(response.data);
      setError("");
    } catch {
      setFavorites([]);
      setError("Nao foi possivel carregar favoritos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const removeFavorite = async (bookId: string) => {
    if (!headers) return;
    setDeletingBookId(bookId);
    try {
      await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
      await loadFavorites();
      showToast("Favorito removido com sucesso.", "success");
    } catch {
      showToast("Falha ao remover favorito.", "error");
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Seus capitulos preferidos continuam aqui</h2>
          <p className="section-sub">Retome os livros que marcaram sua jornada.</p>
        </div>
        <span className="kpi">{favorites.length} itens</span>
      </div>

      {loading && <p className="section-sub">Carregando favoritos...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && favorites.length > 0 && (
        <article className="card">
          <div className="section-head">
            <div>
              <h3>Prontos para reabrir</h3>
              <p className="section-sub">Escolha um favorito e volte direto para a experiencia de leitura.</p>
            </div>
            <span className="kpi">Biblioteca pessoal</span>
          </div>
        </article>
      )}

      <div className="grid">
        {favorites.map((item) => (
          <article key={item.bookId} className="card">
            <BookCover title={item.bookTitle} coverUrl={item.coverUrl} size="medium" />
            <div className="book-card-badges">
              {item.source === "OPEN" && <span className="import-badge">OPEN LIBRARY</span>}
              <span className="favorite-badge">FAVORITO</span>
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
                className="btn-muted"
                onClick={() => removeFavorite(item.bookId)}
                disabled={deletingBookId === item.bookId}
              >
                {deletingBookId === item.bookId ? "Removendo..." : "Remover"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && favorites.length === 0 && (
        <p className="section-sub">Voce ainda nao adicionou livros aos favoritos.</p>
      )}
    </section>
  );
}
