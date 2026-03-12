import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";

type Review = {
  id: string;
  bookId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type BookOption = { id: string; title: string };
type Paged<T> = { content: T[]; page: { size: number; number: number; totalElements: number; totalPages: number } };

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function ReviewsPage() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const size = 8;

  const [items, setItems] = useState<Review[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [bookId, setBookId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const headers = auth ? { Authorization: `Bearer ${auth.token}` } : undefined;

  const loadPage = async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const [reviewsResponse, booksResponse] = await Promise.all([
        api.get<Paged<Review>>(`/api/v1/reviews/me?page=${page}&size=${size}`, { headers }),
        api.get<Paged<BookOption>>("/api/v1/books?page=0&size=30&includeWithoutPdf=true"),
      ]);
      setItems(reviewsResponse.data.content);
      setTotalPages(reviewsResponse.data.page.totalPages);
      setBookOptions(booksResponse.data.content);
      if (!bookId && booksResponse.data.content.length > 0) {
        setBookId(booksResponse.data.content[0].id);
      }
      setError("");
    } catch {
      setItems([]);
      setError("Nao foi possivel carregar reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, page]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !bookId) return;
    setCreating(true);
    try {
      await api.post(
        "/api/v1/reviews",
        {
          bookId,
          rating: Number(rating),
          comment,
        },
        { headers }
      );
      setComment("");
      await loadPage();
      showToast("Review criada com sucesso.", "success");
    } catch {
      showToast("Falha ao criar review (ou review ja existente para o livro).", "error");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (reviewId: string) => {
    if (!headers) return;
    setDeletingId(reviewId);
    try {
      await api.delete(`/api/v1/reviews/${reviewId}`, { headers });
      await loadPage();
      showToast("Review removida com sucesso.", "success");
    } catch {
      showToast("Falha ao remover review.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 0) params.delete("page");
    else params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  };

  return (
    <section className="grid">
      <article className="card">
        <div className="section-head">
          <h3>Nova review</h3>
        </div>
        <form onSubmit={onCreate}>
          <label>Livro</label>
          <select value={bookId} onChange={(event) => setBookId(event.target.value)}>
            {bookOptions.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          <label>Nota (1 a 5)</label>
          <input type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} />
          <label>Comentario</label>
          <input value={comment} onChange={(event) => setComment(event.target.value)} />
          <button type="submit" disabled={creating}>
            {creating ? "Salvando..." : "Salvar review"}
          </button>
        </form>
      </article>

      <article className="card">
        <div className="section-head">
          <div>
            <h2>Suas percepções importam</h2>
            <p className="section-sub">Crie, acompanhe e ajuste suas avaliações de leitura.</p>
          </div>
          <span className="kpi">Página {page + 1}</span>
        </div>

        {loading && <p className="section-sub">Carregando reviews...</p>}
        {error && <p className="error">{error}</p>}

        <div className="grid">
          {items.map((review) => (
            <article key={review.id} className="card">
              <h3>Livro: {review.bookId}</h3>
              <p>Nota: {review.rating}</p>
              <p>{review.comment}</p>
              <small>Atualizado em: {new Date(review.updatedAt).toLocaleString()}</small>
              <div className="card-actions">
                <button
                  className="btn-muted"
                  onClick={() => onDelete(review.id)}
                  disabled={deletingId === review.id}
                >
                  {deletingId === review.id ? "Removendo..." : "Excluir"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="pagination-row">
          <button className="btn-muted" disabled={page <= 0 || loading} onClick={() => goToPage(page - 1)}>
            Anterior
          </button>
          <span className="section-sub">
            Página {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <button
            className="btn-muted"
            disabled={loading || page + 1 >= Math.max(totalPages, 1)}
            onClick={() => goToPage(page + 1)}
          >
            Próxima
          </button>
        </div>
      </article>
    </section>
  );
}

