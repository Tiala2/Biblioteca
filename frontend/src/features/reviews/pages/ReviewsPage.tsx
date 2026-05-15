import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, PencilLine, ScrollText, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorCode, extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { BookCover } from "@shared/ui/books/BookCover";
import { useToast } from "@shared/ui/toast/ToastContext";

type Review = {
  id: string;
  bookId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type BookOption = {
  id: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
};
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

function RatingStars({ value }: { value: number }) {
  return (
    <span className="review-stars" aria-label={`Nota ${value} de 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={index < value ? "review-star review-star--filled" : "review-star"}
          fill="currentColor"
        />
      ))}
    </span>
  );
}

type RatingPickerProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
};

function RatingPicker({ value, onChange, disabled = false, label }: RatingPickerProps) {
  return (
    <div className="rating-picker" role="radiogroup" aria-label={label}>
      <input type="number" min={1} max={5} value={value} readOnly hidden aria-hidden="true" />
      {Array.from({ length: 5 }, (_, index) => {
        const nextValue = index + 1;
        const selected = value === nextValue;

        return (
          <button
            key={nextValue}
            type="button"
            className={nextValue <= value ? "rating-picker__star rating-picker__star--active" : "rating-picker__star"}
            role="radio"
            aria-checked={selected}
            aria-label={`${nextValue} estrela${nextValue > 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => onChange(nextValue)}
          >
            <Star aria-hidden="true" fill="currentColor" />
          </button>
        );
      })}
      <span className="rating-picker__value">{value}/5</span>
    </div>
  );
}

export function ReviewsPage() {
  const headers = useAuthHeaders();
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

  const preselectedBookId = searchParams.get("bookId") ?? "";
  const bookTitleById = useMemo(
    () => Object.fromEntries(bookOptions.map((option) => [option.id, option.title])),
    [bookOptions]
  );
  const bookById = useMemo(
    () => Object.fromEntries(bookOptions.map((option) => [option.id, option])),
    [bookOptions]
  );
  const eligibleBooks = useMemo(
    () => bookOptions.filter((option) => eligibleBookIds.includes(option.id)),
    [bookOptions, eligibleBookIds]
  );
  const hasEligibleBooks = eligibleBooks.length > 0;
  const selectedBook = bookById[bookId] ?? null;
  const reviewStats = useMemo(() => {
    const total = items.length;
    const average = total > 0 ? items.reduce((sum, item) => sum + item.rating, 0) / total : 0;
    const highest = total > 0 ? Math.max(...items.map((item) => item.rating)) : 0;
    const withComment = items.filter((item) => item.comment.trim().length > 0).length;
    const latestUpdated =
      items
        .map((item) => new Date(item.updatedAt).getTime())
        .filter(Number.isFinite)
        .sort((left, right) => right - left)[0] ?? null;

    return {
      total,
      average: average.toFixed(1).replace(".", ","),
      highest,
      withComment,
      latestUpdatedLabel: latestUpdated ? new Date(latestUpdated).toLocaleDateString() : "-",
    };
  }, [items]);

  const loadPage = useCallback(async () => {
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
    } catch (error) {
      setItems([]);
      setEligibleBookIds([]);
      setError(extractApiErrorMessage(error, "Não foi possível carregar avaliações."));
    } finally {
      setLoading(false);
    }
  }, [headers, page, preselectedBookId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

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
      showToast("Avaliação criada com sucesso.", "success");
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
      showToast("Avaliação atualizada com sucesso.", "success");
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
      showToast("Avaliação removida com sucesso.", "success");
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
    <section className="grid aura-page">
      <article className="card hero aura-hero aura-hero--reviews">
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Diário de percepções</p>
            <h2>Suas percepções importam</h2>
            <p>Registre o que ficou da leitura, ajuste sua opinião e transforme cada livro em memória organizada.</p>
          </div>
          <div className="aura-hero__signal">
            <MessageSquareQuote aria-hidden="true" />
            <strong>{items.length}</strong>
            <span>avaliação(ões)</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><PencilLine aria-hidden="true" /> Nova avaliação</h3>
          <span className="kpi">{eligibleBooks.length} livro(s) elegível(is)</span>
        </div>
        <p className="section-sub">
          Para manter o contexto da leitura, a plataforma libera avaliações apenas para livros que você já iniciou.
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
          {selectedBook ? (
            <div className="review-book-preview">
              <BookCover title={selectedBook.title} coverUrl={selectedBook.coverUrl} isbn={selectedBook.isbn} size="small" />
              <div>
                <strong>
                  <Link to={`/books/${selectedBook.id}`} className="btn-link">
                    {selectedBook.title}
                  </Link>
                </strong>
                <small>
                  {selectedBook.author ?? "Autor não informado"}
                  {selectedBook.source === "OPEN" ? " - Open Library" : ""}
                </small>
                <div className="review-book-badges">
                  <span className={selectedBook.source === "OPEN" ? "import-badge" : "favorite-badge"}>
                    {selectedBook.source === "OPEN" ? "OPEN LIBRARY" : "LOCAL"}
                  </span>
                  <span className="import-badge">Elegivel para review</span>
                </div>
              </div>
            </div>
          ) : null}
          {!hasEligibleBooks && (
            <div>
              <p className="section-sub">
                Comece uma leitura no catálogo para liberar a criação de avaliações.
              </p>
              <div className="card-actions">
                <Link to="/books" className="btn-muted btn-link">
                  Explorar catálogo
                </Link>
              </div>
            </div>
          )}
          <label>Nota</label>
          <RatingPicker value={rating} onChange={setRating} disabled={!hasEligibleBooks} label="Nota da nova avaliação" />
          <label>Comentário</label>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={!hasEligibleBooks}
            maxLength={600}
            rows={4}
          />
          <small className="form-hint">{comment.length}/600 caracteres</small>
          <button type="submit" disabled={creating || !hasEligibleBooks}>
            {creating ? "Salvando..." : "Salvar avaliação"}
          </button>
        </form>
      </article>

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <div>
            <h3><ScrollText aria-hidden="true" /> Avaliações registradas</h3>
            <p className="section-sub">Crie, acompanhe, ajuste e remova suas avaliações de leitura.</p>
          </div>
          <span className="kpi">Página {page + 1}</span>
        </div>

        {loading && (
          <div className="panel-inline-state panel-inline-state--loading" role="status" aria-live="polite" aria-busy="true">
            <p className="eyebrow">Carregando</p>
            <h3>Buscando suas avaliações</h3>
            <p className="section-sub">Estamos atualizando notas, comentários e livros relacionados.</p>
          </div>
        )}
        <div className="review-insights">
          <div className="stat-box">
            <strong>{reviewStats.total}</strong>
            <span>Nesta página</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.average}</strong>
            <span>Média das notas</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.highest || "-"}</strong>
            <span>Maior nota</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.withComment}</strong>
            <span>Com comentário</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.latestUpdatedLabel}</strong>
            <span>Última atualização</span>
          </div>
        </div>

        {error && (
          <div className="panel-inline-state panel-inline-state--error" role="alert">
            <p className="eyebrow">Atenção</p>
            <h3>Falha ao carregar avaliações</h3>
            <p className="section-sub">{error}</p>
          </div>
        )}

        <div className="grid aura-review-grid">
          {items.map((review) => {
            const isEditing = editingId === review.id;
            const reviewBook = bookById[review.bookId];

            return (
              <article key={review.id} className="card aura-review-card">
                <div className="inline-book-row review-book-row">
                  <BookCover
                    title={resolveBookLabel(review)}
                    coverUrl={reviewBook?.coverUrl}
                    isbn={reviewBook?.isbn}
                    size="small"
                  />
                  <div>
                    <h3>
                      <Link to={`/books/${review.bookId}`} className="btn-link">
                        {resolveBookLabel(review)}
                      </Link>
                    </h3>
                    <small>{reviewBook?.author ?? "Autor não informado"}</small>
                    <div className="review-book-badges">
                      <span className={reviewBook?.source === "OPEN" ? "import-badge" : "favorite-badge"}>
                        {reviewBook?.source === "OPEN" ? "OPEN LIBRARY" : "LOCAL"}
                      </span>
                      <span className="import-badge">
                        {review.comment.trim().length > 0 ? `${review.comment.trim().length} caracteres` : "Sem comentário"}
                      </span>
                    </div>
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <label>Nota</label>
                    <RatingPicker value={editRating} onChange={setEditRating} label="Nota da avaliação em edição" />
                    <label>Comentário</label>
                    <textarea
                      value={editComment}
                      onChange={(event) => setEditComment(event.target.value)}
                      maxLength={600}
                      rows={4}
                    />
                    <small className="form-hint">{editComment.length}/600 caracteres</small>
                  </>
                ) : (
                  <>
                    <p className="aura-rating"><RatingStars value={review.rating} /> Nota {review.rating}</p>
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
                  <Link to={`/books/${review.bookId}`} className="btn-muted btn-link">
                    Ver livro
                  </Link>
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
          <button
            type="button"
            className="btn-muted"
            aria-label="Ir para a página anterior de avaliações"
            disabled={page <= 0 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Anterior
          </button>
          <span className="section-sub">
            Página {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="btn-muted"
            aria-label="Ir para a próxima página de avaliações"
            disabled={loading || page + 1 >= Math.max(totalPages, 1)}
            onClick={() => goToPage(page + 1)}
          >
            Próxima
          </button>
        </div>

        {!loading && !error && items.length === 0 && (
          <div className="panel-inline-state" role="status" aria-live="polite">
            <p className="eyebrow">Sem dados</p>
            <h3>Nenhuma avaliação registrada</h3>
            <p className="section-sub">
              Suas avaliações aparecerão aqui depois que você iniciar uma leitura e registrar sua primeira percepção.
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
