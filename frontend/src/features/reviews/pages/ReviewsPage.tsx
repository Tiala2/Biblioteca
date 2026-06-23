import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareQuote, PencilLine, ScrollText, Star, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { loadAllPaged } from "@shared/api/pagination";
import { extractApiErrorCode, extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { BookCover } from "@shared/ui/books/BookCover";
import { useToast } from "@shared/ui/toast/ToastContext";
import { formatDateBr, formatDateTimeBr } from "@shared/lib/formatters";
import { formatBookSource, pluralizePt } from "@shared/lib/presentation";

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
  source?: "LOCAL" | "OPEN" | "GUTENBERG";
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
    <span className="review-stars" aria-label={`Avaliação ${value} de 5`}>
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
  const [bookSearch, setBookSearch] = useState("");
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
  const appliedPreselectionRef = useRef("");
  const createFormRef = useRef<HTMLFormElement | null>(null);

  const preselectedBookId = searchParams.get("bookId") ?? "";
  const requestedAction = searchParams.get("action") ?? "";
  const requestedEditReviewId = searchParams.get("editReview") ?? "";
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
  const normalizedBookSearch = bookSearch.trim().toLowerCase();
  const filteredEligibleBooks = useMemo(() => {
    if (!normalizedBookSearch) return eligibleBooks;
    return eligibleBooks.filter((book) =>
      `${book.title} ${book.author ?? ""} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedBookSearch)
    );
  }, [eligibleBooks, normalizedBookSearch]);
  const visibleEligibleBooks = filteredEligibleBooks.slice(0, 60);
  const hasEligibleBooks = eligibleBooks.length > 0;
  const selectedBook = bookById[bookId] ?? null;
  const requestedBook = preselectedBookId ? bookById[preselectedBookId] : null;
  const requestedBookNeedsReading = Boolean(
    preselectedBookId && requestedBook && !eligibleBookIds.includes(preselectedBookId)
  );
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
      latestUpdatedLabel: latestUpdated ? formatDateBr(new Date(latestUpdated).toISOString()) : "Ainda sem registro",
    };
  }, [items]);

  const loadPage = useCallback(async () => {
    if (!headers) return;
    setLoading(true);
    try {
      const [reviewsResponse, booksResponse, readingsResponse] = await Promise.all([
        api.get<Paged<Review>>(`/api/v1/reviews/me?page=${page}&size=${size}`, { headers }),
        loadAllPaged<BookOption>("/api/v1/books?includeWithoutPdf=true"),
        api.get<Reading[]>("/api/v1/readings/me", { headers }),
      ]);
      const readableBookIds = Array.from(new Set(readingsResponse.data.map((item) => item.book.id)));
      setItems(reviewsResponse.data.content);
      setTotalPages(reviewsResponse.data.page.totalPages);
      setBookOptions(booksResponse);
      setEligibleBookIds(readableBookIds);
      const preferredBookId =
        preselectedBookId && readableBookIds.includes(preselectedBookId)
          ? preselectedBookId
          : readableBookIds[0] ?? "";
      setBookId((previous) => (previous && readableBookIds.includes(previous) ? previous : preferredBookId));
      const preferredBook = booksResponse.find((book) => book.id === preferredBookId);
      if (preselectedBookId && preferredBook) {
        setBookSearch(preferredBook.title);
        appliedPreselectionRef.current = preselectedBookId;
      } else {
        setBookSearch((previous) => previous || preferredBook?.title || "");
      }
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

  useEffect(() => {
    if (selectedBook && preselectedBookId === selectedBook.id && appliedPreselectionRef.current !== preselectedBookId) {
      setBookSearch(selectedBook.title);
      appliedPreselectionRef.current = preselectedBookId;
    }
  }, [preselectedBookId, selectedBook]);

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
          ? "Inicie a leitura deste livro antes de registrar uma avaliação."
          : extractApiErrorMessage(error, "Não foi possível criar a avaliação.");
      showToast(message, "error");
    } finally {
      setCreating(false);
    }
  };

  const startEditing = useCallback((review: Review, updateUrl = true) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    if (updateUrl) {
      const params = new URLSearchParams(searchParams);
      params.set("editReview", review.id);
      params.delete("action");
      setSearchParams(params, { replace: true });
    }
    window.requestAnimationFrame(() => {
      const reviewCard = document.getElementById(`review-${review.id}`);
      reviewCard?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      reviewCard?.querySelector<HTMLElement>("textarea, button, a")?.focus();
    });
  }, [searchParams, setSearchParams]);

  const cancelEditing = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment("");
    const params = new URLSearchParams(searchParams);
    params.delete("editReview");
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (requestedEditReviewId && items.length > 0 && editingId !== requestedEditReviewId) {
      const review = items.find((item) => item.id === requestedEditReviewId);
      if (review) startEditing(review, false);
    }
  }, [editingId, items, requestedEditReviewId, startEditing]);

  useEffect(() => {
    if (requestedAction === "create" || preselectedBookId) {
      window.requestAnimationFrame(() => {
        createFormRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
        createFormRef.current?.querySelector<HTMLElement>("input, button, textarea")?.focus();
      });
    }
  }, [preselectedBookId, requestedAction]);

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
      showToast(extractApiErrorMessage(error, "Não foi possível atualizar a avaliação."), "error");
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
      showToast(extractApiErrorMessage(error, "Não foi possível remover a avaliação."), "error");
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
    <section className="grid aura-page aura-reviews-page">
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
            <span>{items.length === 1 ? "avaliação" : "avaliações"}</span>
          </div>
        </div>
      </article>

      <article className={`card aura-panel review-create-panel${hasEligibleBooks ? "" : " review-create-panel--empty"}`}>
        <div className="section-head">
          <h3><PencilLine aria-hidden="true" /> Avaliar leitura</h3>
          <span className="kpi">{pluralizePt(eligibleBooks.length, "livro elegível", "livros elegíveis")}</span>
        </div>
          <p className="section-sub">
            Para manter o contexto da leitura, a plataforma libera avaliações apenas para livros que você já iniciou.
          </p>
          {requestedBookNeedsReading && requestedBook ? (
            <div className="panel-inline-state review-book-warning" role="status">
              <BookCover title={requestedBook.title} coverUrl={requestedBook.coverUrl} isbn={requestedBook.isbn} size="small" />
              <div>
                <strong>{requestedBook.title}</strong>
                <p className="section-sub">
                  Este livro ainda precisa ter uma leitura iniciada antes da avaliação.
                </p>
                <div className="card-actions">
                  <Link to={`/books/${requestedBook.id}/read`} className="btn-link">
                    Iniciar leitura
                  </Link>
                  <Link to={`/books/${requestedBook.id}`} className="btn-muted btn-link">
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        <form ref={createFormRef} onSubmit={onCreate}>
          <label>Livro</label>
          <input
            aria-label="Buscar livro para nova avaliação"
            value={bookSearch}
            onChange={(event) => setBookSearch(event.target.value)}
            disabled={!hasEligibleBooks || creating}
            placeholder="Buscar por título, autor ou ISBN"
          />
          <div className="admin-book-picker review-book-picker" aria-label="Livros elegíveis para avaliação">
            <div hidden>
              <select aria-label="Livro da nova avaliação" value={bookId} onChange={(event) => setBookId(event.target.value)} disabled={!hasEligibleBooks || creating}>
                {eligibleBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
            {visibleEligibleBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                className={book.id === bookId ? "admin-book-picker__item active" : "admin-book-picker__item"}
                aria-pressed={book.id === bookId}
                disabled={creating}
                onClick={() => {
                  setBookId(book.id);
                  setBookSearch(book.title);
                }}
              >
                <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
                <span>
                  <strong>{book.title}</strong>
                  <small>{book.author ?? "Autor não informado"} · {formatBookSource(book.source)}</small>
                </span>
              </button>
            ))}
            {hasEligibleBooks && filteredEligibleBooks.length === 0 && (
              <p className="section-sub">Nenhum livro iniciado foi encontrado para essa busca.</p>
            )}
            {filteredEligibleBooks.length > visibleEligibleBooks.length && (
              <small className="section-sub">Mostrando os primeiros 60 resultados. Refine a busca para encontrar mais rápido.</small>
            )}
          </div>
          {selectedBook ? (
            <div className="review-book-preview">
              <BookCover title={selectedBook.title} coverUrl={selectedBook.coverUrl} isbn={selectedBook.isbn} size="small" />
              <div>
                <strong>
                  <Link to={`/books/${selectedBook.id}`} className="text-link">
                    {selectedBook.title}
                  </Link>
                </strong>
                <small>
                  {selectedBook.author ?? "Autor não informado"}
                  {selectedBook.source && selectedBook.source !== "LOCAL" ? ` · ${formatBookSource(selectedBook.source)}` : ""}
                </small>
                <div className="review-book-badges">
                  <span className={selectedBook.source === "OPEN" ? "import-badge" : "favorite-badge"}>
                    {formatBookSource(selectedBook.source)}
                  </span>
                  <span className="import-badge">Elegível para avaliação</span>
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
                  Explorar livros
                </Link>
              </div>
            </div>
          )}
          <label>Avaliação</label>
          <RatingPicker value={rating} onChange={setRating} disabled={!hasEligibleBooks} label="Avaliação da nova leitura" />
          <label>Comentário</label>
          <textarea
            aria-label="Comentário da nova avaliação"
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
            <h3><ScrollText aria-hidden="true" /> Minhas avaliações</h3>
            <p className="section-sub">Crie, acompanhe, ajuste e remova suas avaliações de leitura.</p>
          </div>
          <span className="kpi">Página {page + 1}</span>
        </div>

        {loading && (
          <div className="panel-inline-state panel-inline-state--loading" role="status" aria-live="polite" aria-busy="true">
            <p className="eyebrow">Carregando</p>
            <h3>Buscando suas avaliações</h3>
            <p className="section-sub">Estamos atualizando avaliações, comentários e livros relacionados.</p>
          </div>
        )}
        <div className="review-insights">
          <div className="stat-box">
            <strong>{reviewStats.total}</strong>
            <span>Nesta página</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.average}</strong>
            <span>Avaliação média</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.highest || "-"}</strong>
            <span>Maior avaliação</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.withComment}</strong>
            <span>Avaliações comentadas</span>
          </div>
          <div className="stat-box">
            <strong>{reviewStats.latestUpdatedLabel}</strong>
            <span>Última atualização</span>
          </div>
        </div>

        {error && (
          <div className="panel-inline-state panel-inline-state--error" role="alert">
            <p className="eyebrow">Atenção</p>
            <h3>Não foi possível carregar suas avaliações</h3>
            <p className="section-sub">{error}</p>
          </div>
        )}

        <div className="grid aura-review-grid">
          {items.map((review) => {
            const isEditing = editingId === review.id;
            const reviewBook = bookById[review.bookId];

            return (
              <article key={review.id} id={`review-${review.id}`} className="card aura-review-card">
                <div className="inline-book-row review-book-row">
                  <BookCover
                    title={resolveBookLabel(review)}
                    coverUrl={reviewBook?.coverUrl}
                    isbn={reviewBook?.isbn}
                    size="small"
                  />
                  <div>
                    <h3>
                      <Link to={`/books/${review.bookId}`} className="text-link">
                        {resolveBookLabel(review)}
                      </Link>
                    </h3>
                    <small>{reviewBook?.author ?? "Autor não informado"}</small>
                    <div className="review-book-badges">
                      <span className={reviewBook?.source === "OPEN" ? "import-badge" : "favorite-badge"}>
                        {formatBookSource(reviewBook?.source)}
                      </span>
                      <span className="import-badge">
                        {review.comment.trim().length > 0 ? `${review.comment.trim().length} caracteres` : "Sem comentário"}
                      </span>
                    </div>
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <label>Avaliação</label>
                    <RatingPicker value={editRating} onChange={setEditRating} label="Avaliação em edição" />
                    <label>Comentário</label>
                    <textarea
                      aria-label="Comentário da avaliação em edição"
                      value={editComment}
                      onChange={(event) => setEditComment(event.target.value)}
                      maxLength={600}
                      rows={4}
                    />
                    <small className="form-hint">{editComment.length}/600 caracteres</small>
                  </>
                ) : (
                  <>
                    <p className="aura-rating"><RatingStars value={review.rating} /> {review.rating} estrelas</p>
                    <p className="review-comment text-break">{review.comment.trim() || "Sem comentário registrado."}</p>
                  </>
                )}
                <small>Atualizado em {formatDateTimeBr(review.updatedAt)}</small>
                <div className="card-actions review-card-actions">
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
                      <PencilLine aria-hidden="true" />
                      Editar
                    </button>
                  )}
                  <Link to={`/books/${review.bookId}`} className="btn-muted btn-link">
                    <ScrollText aria-hidden="true" />
                    Abrir livro
                  </Link>
                  <button
                    className="btn-muted btn-danger"
                    onClick={() => onDelete(review.id)}
                    disabled={deletingId === review.id}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" />
                    {deletingId === review.id ? "Removendo..." : "Remover"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
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
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              className="btn-muted"
              aria-label="Ir para a próxima página de avaliações"
              disabled={loading || page + 1 >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Próxima
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="panel-inline-state" role="status" aria-live="polite">
            <p className="eyebrow">Nada por enquanto</p>
            <h3>Nenhuma avaliação registrada</h3>
            <p className="section-sub">
              Suas avaliações aparecerão aqui depois que você iniciar uma leitura e registrar sua primeira percepção.
            </p>
            <div className="card-actions review-card-actions">
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
