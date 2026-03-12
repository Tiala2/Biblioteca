import { useEffect, useState } from "react";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";

type Favorite = {
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
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
          <h2>Seus capítulos preferidos continuam aqui</h2>
          <p className="section-sub">Retome os livros que marcaram sua jornada.</p>
        </div>
        <span className="kpi">{favorites.length} itens</span>
      </div>

      {loading && <p className="section-sub">Carregando favoritos...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {favorites.map((item) => (
          <article key={item.bookId} className="card">
            <h3>{item.bookTitle}</h3>
            <p>ISBN: {item.bookIsbn}</p>
            <small>Favoritado em: {new Date(item.createdAt).toLocaleString()}</small>
            <div className="card-actions">
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

      {!loading && favorites.length === 0 && <p className="section-sub">Você ainda não adicionou livros aos favoritos.</p>}
    </section>
  );
}

