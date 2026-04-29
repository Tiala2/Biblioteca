import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorCode, extractApiErrorMessage } from "@shared/api/errors";
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
type Reading = {
  id: string;
  status: string;
  book: BookOption;
};
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
  const [eligibleBookIds, setEligibleBookIds] = useState<string[]>([]);
  const [bookId, setBookId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const headers = auth ? { Authorization: `Bearer ${auth.token}` } : undefined;
  const preselectedBookId = searchParams.get("bookId") ?? "";
  const bookTitleById = useMemo(
    () => Object.fromEntries(bookOptions.map((option) => [option.id, option.title])),
    [bookOptions]
  );
  const eligibleBooks = useMemo(
    () => bookOptions.filter((option) => eligibleBookIds.includes(option.id)),
    [bookOptions, eligibleBookIds]
  );
  const hasEligibleBooks = eligibleBooks.length > 0;

  const loadPage = async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const [reviewsResponse, booksResponse, readingsResponse] = await Promise.all([
        api.get<Paged<Review>>(`/api/v1/reviews/me?page=${page}&size=${size}`, { headers }),
        api.get<Paged<BookOption>>("/api/v1/books?page=0&size=100&includeWithoutPdf=true"),
        api.get<Reading[]>("/api/v1/readings/me", { headers }),
      ]);
      const readableBookIds = Array.from(new Set(readingsResponse.data.map((item) => item.book.id)));
      setItems(reviewsResponse.data.content);
      setTotalPages(reviewsResponse.data.page.totalPages);
      setBookOptions(booksResponse.data.content);
      setEligibleBookIds(readableBookIds);
      const preferredBookId =
        preselectedBookId && readableBookIds.includes(preselectedBookId)
          ? preselectedBookId
          : readableBookIds[0] ?? "";
      setBookId((previous) => (previous && readableBookIds.includes(previous) ? previous : preferredBookId));
      setError("");
    } catch {
      setItems([]);
      setEligibleBookIds([]);
      setError("Nao foi possivel carregar reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, page, preselectedBookId]);

  const resolveBookLabel = (review: Review) => {
    return bookTitleById[review.bookId] ?? review.bookId;
  };

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
    } catch (error) {
      const errorCode = extractApiErrorCode(error);
      const message =
        errorCode === "REVIEW_NOT_ALLOWED"
          ? "Inicie a leitura deste livro antes de registrar uma review."
          : extractApiErrorMessage(error, "Falha ao criar review.");
      showToast(message, "error");
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment("");
  };

  const onUpdate = async (reviewId: string) => {
    if (!headers) return;
    setSavingId(reviewId);
    try {
      await api.patch(
        `/api/v1/reviews/${reviewId}`,
        {
          rating: Number(editRating),
          comment: editComment,
        },
        { headers }
      );
      await loadPage();
      cancelEditing();
      showToast("Review atualizada com sucesso.", "success");
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Falha ao atualizar review."), "error");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (reviewId: string) => {
    if (!headers) return;
    setDeletingId(reviewId);
    try {
      await api.delete(`/api/v1/reviews/${reviewId}`, { headers });
      if (editingId === reviewId) {
        cancelEditing();
      }
      await loadPage();
      showToast("Review removida com sucesso.", "success");
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Falha ao remover review."), "error");
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
          <span className="kpi">{eligibleBooks.length} livro(s) elegivel(is)</span>
        </div>
        <p className="section-sub">
          Para manter o contexto da leitura, a plataforma libera reviews apenas para livros que voce ja iniciou.
        </p>
        <form onSubmit={onCreate}>
          <label>Livro</label>
          <select value={bookId} onChange={(event) => setBookId(event.target.value)} disabled={!hasEligibleBooks || creating}>
            {eligibleBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          {!hasEligibleBooks && (
            <div>
              <p className="section-sub">
                Comece uma leitura no catalogo para liberar a criacao de reviews.
              </p>
              <div className="card-actions">
                <Link to="/books" className="btn-muted btn-link">
                  Explorar catalogo
                </Link>
              </div>
            </div>
          )}
          <label>Nota (1 a 5)</label>
          <input type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} disabled={!hasEligibleBooks} />
          <label>Comentario</label>
          <input value={comment} onChange={(event) => setComment(event.target.value)} disabled={!hasEligibleBooks} />
          <button type="submit" disabled={creating || !hasEligibleBooks}>
            {creating ? "Salvando..." : "Salvar review"}
          </button>
        </form>
      </article>

      <article className="card">
        <div className="section-head">
          <div>
            <h2>Suas percepcoes importam</h2>
            <p className="section-sub">Crie, acompanhe, ajuste e remova suas avaliacoes de leitura.</p>
          </div>
          <span className="kpi">Pagina {page + 1}</span>
        </div>

        {loading && <p className="section-sub">Carregando reviews...</p>}
        {error && <p className="error">{error}</p>}

        <div className="grid">
          {items.map((review) => {
            const isEditing = editingId === review.id;

            return (
              <article key={review.id} className="card">
                <h3>{resolveBookLabel(review)}</h3>
                {isEditing ? (
                  <>
                    <label>Nota</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editRating}
                      onChange={(event) => setEditRating(Number(event.target.value))}
                    />
                    <label>Comentario</label>
                    <input value={editComment} onChange={(event) => setEditComment(event.target.value)} />
                  </>
                ) : (
                  <>
                    <p>Nota: {review.rating}</p>
                    <p>{review.comment}</p>
                  </>
                )}
                <small>Atualizado em: {new Date(review.updatedAt).toLocaleString()}</small>
                <div className="card-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-muted"
                        onClick={() => onUpdate(review.id)}
                        disabled={savingId === review.id}
                        type="button"
                      >
                        {savingId === review.id ? "Salvando..." : "Salvar"}
                      </button>
                      <button className="btn-muted" onClick={cancelEditing} type="button">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-muted" onClick={() => startEditing(review)} type="button">
                      Editar
                    </button>
                  )}
                  <button
                    className="btn-muted"
                    onClick={() => onDelete(review.id)}
                    disabled={deletingId === review.id}
                    type="button"
                  >
                    {deletingId === review.id ? "Removendo..." : "Excluir"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="pagination-row">
          <button className="btn-muted" disabled={page <= 0 || loading} onClick={() => goToPage(page - 1)}>
            Anterior
          </button>
          <span className="section-sub">
            Pagina {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <button
            className="btn-muted"
            disabled={loading || page + 1 >= Math.max(totalPages, 1)}
            onClick={() => goToPage(page + 1)}
          >
            Proxima
          </button>
        </div>

        {!loading && !error && items.length === 0 && (
          <div>
            <h3>Nenhuma review registrada</h3>
            <p className="section-sub">
              Suas avaliacoes aparecerao aqui depois que voce iniciar uma leitura e registrar sua primeira percepcao.
            </p>
            <div className="card-actions">
              <Link to="/books" className="btn-muted btn-link">
                Ver livros
              </Link>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
