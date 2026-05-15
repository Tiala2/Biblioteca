import { useEffect, useMemo, useState } from "react";
import { BookMarked, MessageCircle, Sparkles, Star, Tags, WandSparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { BookCover } from "@shared/ui/books/BookCover";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatDateBr, formatDateTimeBr, formatDecimal, formatInteger } from "@shared/lib/formatters";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

type BookDetails = {
  id: string;
  title: string;
  author?: string | null;
  isbn?: string;
  numberOfPages: number;
  publicationDate?: string | null;
  coverUrl?: string | null;
  hasPdf: boolean;
  hasNarrative?: boolean;
  source?: "LOCAL" | "OPEN";
  averageRating?: number | null;
  totalReviews?: number | null;
  pdfUrl?: string | null;
  categories?: Category[];
  tags?: Tag[];
};

type Review = {
  id: string;
  bookId: string;
  rating: number;
  comment: string;
  updatedAt: string;
};

type RecommendationBook = {
  id: string;
  title: string;
  author?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
};

type Paged<T> = {
  content: T[];
};

function buildRatingStars(rating?: number | null) {
  const filled = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
  return Array.from({ length: 5 }, (_, index) => index < filled);
}

export function BookDetailsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const headers = useAuthHeaders();
  const { showToast } = useToast();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [communityReviews, setCommunityReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationBook[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookId) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const bookRequest = api.get<BookDetails>(`/api/v1/books/${bookId}`);
        const favoriteRequest = headers ? api.get<boolean>(`/api/v1/users/me/favorites/${bookId}`, { headers }) : Promise.resolve(null);
        const reviewRequest = headers
          ? api.get<Paged<Review>>("/api/v1/reviews/me?page=0&size=100", { headers })
          : Promise.resolve(null);
        const communityReviewRequest = api.get<Paged<Review>>("/api/v1/reviews?page=0&size=100");
        const recommendationRequest = api.get<RecommendationBook[]>("/api/v1/books/recommendations?limit=6");

        const [bookResponse, favoriteResponse, reviewResponse, communityReviewResponse, recommendationResponse] = await Promise.all([
          bookRequest,
          favoriteRequest,
          reviewRequest,
          communityReviewRequest,
          recommendationRequest,
        ]);
        if (!active) return;

        setBook(bookResponse.data);
        setIsFavorite(Boolean(favoriteResponse?.data));
        setMyReview(reviewResponse?.data.content.find((item) => item.bookId === bookId) ?? null);
        setCommunityReviews(
          communityReviewResponse.data.content
            .filter((item) => item.bookId === bookId)
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
            .slice(0, 3)
        );
        setRecommendations(recommendationResponse.data.filter((item) => item.id !== bookId).slice(0, 3));
        setError("");
      } catch (error) {
        if (!active) return;
        setBook(null);
        setMyReview(null);
        setCommunityReviews([]);
        setRecommendations([]);
        setError(extractApiErrorMessage(error, "Não foi possível carregar os detalhes do livro."));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [bookId, headers]);

  const metadata = useMemo(() => {
    if (!book) return [];

    return [
      { label: "Páginas", value: `${book.numberOfPages}` },
      { label: "Autor", value: book.author || "Autor não informado" },
      { label: "Origem", value: book.source === "OPEN" ? "Open Library" : "Catálogo local" },
      { label: "Dinâmica", value: book.hasNarrative ? "Disponível" : "Em breve" },
      { label: "ISBN", value: book.isbn || "Não informado" },
      {
        label: "Publicação",
        value: book.publicationDate ? formatDateBr(book.publicationDate) : "Não informada",
      },
    ];
  }, [book]);
  const ratingStars = useMemo(() => buildRatingStars(book?.averageRating), [book?.averageRating]);
  const detailInsights = useMemo(() => {
    const communityAverage =
      communityReviews.length > 0
        ? communityReviews.reduce((total, review) => total + review.rating, 0) / communityReviews.length
        : 0;
    const latestCommunityReview = communityReviews[0] ?? null;

    return {
      categoryCount: book?.categories?.length ?? 0,
      communityAverage,
      latestCommunityReview,
      tagCount: book?.tags?.length ?? 0,
    };
  }, [book, communityReviews]);

  const toggleFavorite = async () => {
    if (!headers || !bookId) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/api/v1/users/me/favorites/${bookId}`, { headers });
        setIsFavorite(false);
        showToast("Livro removido dos favoritos.", "success");
      } else {
        await api.post("/api/v1/users/me/favorites", { bookId }, { headers });
        setIsFavorite(true);
        showToast("Livro adicionado aos favoritos.", "success");
      }
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Não foi possível atualizar favorito."), "error");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (!bookId) {
    return (
      <StateCard
        title="Livro não informado"
        message="Abra um livro a partir do catálogo para visualizar os detalhes e os próximos passos."
        variant="error"
      />
    );
  }

  if (loading) {
    return (
      <StateCard
        title="Detalhes em carregamento"
        message="Estamos preparando os dados do livro, suas ações rápidas e as sugestões relacionadas."
        variant="loading"
      />
    );
  }

  return (
    <section className="grid aura-page">
      <article className="card hero aura-hero aura-book-detail-hero">
        <div className="aura-book-detail-hero__cover">
          {book && <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="large" />}
        </div>
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Livro em foco</p>
            <h2>{book?.title ?? "Detalhes do livro"}</h2>
            <p>
              Uma página para sentir o livro antes de abrir: contexto, recepção, tags e próximos passos.
            </p>
          </div>
          <div className="aura-hero__signal">
            <BookMarked aria-hidden="true" />
            <strong>{book?.hasPdf ? "PDF" : "Guia"}</strong>
            <span>{book?.hasPdf ? "local" : "com progresso"}</span>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="stats-grid aura-stats">
          {metadata.map((item) => (
            <div key={item.label} className="stat-box">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="card-actions">
          <Link to={`/books/${bookId}/read`} className="btn-link">
            {book?.hasPdf ? "Ler no app" : "Ler com progresso"}
          </Link>
          <button
            type="button"
            className={isFavorite ? "favorite-toggle active" : "favorite-toggle"}
            aria-pressed={isFavorite}
            onClick={toggleFavorite}
            disabled={!headers || favoriteLoading}
          >
            {favoriteLoading ? "Salvando..." : isFavorite ? "Nos favoritos" : "Salvar nos favoritos"}
          </button>
          <Link to={`/reviews?bookId=${bookId}`} className="btn-muted btn-link">
            Ver reviews
          </Link>
        </div>
        <div className="book-detail-insights">
          <div className="stat-box">
            <strong>{book?.source === "OPEN" ? "OPEN" : "LOCAL"}</strong>
            <span>origem</span>
          </div>
          <div className="stat-box">
            <strong>{book?.hasPdf ? "SIM" : "NÃO"}</strong>
            <span>pdf no app</span>
          </div>
          <div className="stat-box">
            <strong>{isFavorite ? "SALVO" : "LIVRE"}</strong>
            <span>favorito</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Star aria-hidden="true" /> Recepção do catálogo</h3>
          <span className="kpi">
            {formatDecimal(book?.averageRating)} / {book?.totalReviews ?? 0} avaliação(ões)
          </span>
        </div>
        <div className="rating-summary" aria-label={`Nota média ${formatDecimal(book?.averageRating)} de 5`}>
          {ratingStars.map((filled, index) => (
            <Star key={index} aria-hidden="true" className={filled ? "filled" : undefined} />
          ))}
          <strong>{formatDecimal(book?.averageRating)}</strong>
        </div>
        <p className="section-sub">
          Use essa leitura guiada para decidir se o livro entra na sua jornada atual ou fica para uma próxima meta.
        </p>
        <div className="book-detail-insights">
          <div className="stat-box">
            <strong>{formatInteger(detailInsights.categoryCount)}</strong>
            <span>categorias</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(detailInsights.tagCount)}</strong>
            <span>tags</span>
          </div>
          <div className="stat-box">
            <strong>{formatDecimal(detailInsights.communityAverage)}</strong>
            <span>média dos destaques</span>
          </div>
        </div>
        <div className="taxonomy-panel">
          <div>
            <strong><Tags aria-hidden="true" /> Categorias</strong>
            {book?.categories?.length ? (
              <div className="taxonomy-chip-row">
                {book.categories.map((item) => (
                  <Link key={item.id} className="taxonomy-chip" to={`/books?categoryId=${item.id}`}>
                    {item.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="section-sub">Sem categorias</p>
            )}
          </div>
          <div>
            <strong><Tags aria-hidden="true" /> Tags</strong>
            {book?.tags?.length ? (
              <div className="taxonomy-chip-row">
                {book.tags.map((item) => (
                  <Link key={item.id} className="taxonomy-chip taxonomy-chip--tag" to={`/books?tagId=${item.id}`}>
                    {item.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="section-sub">Sem tags</p>
            )}
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Sparkles aria-hidden="true" /> Seu contexto</h3>
          <span className="kpi">{myReview ? "Com avaliação" : "Sem avaliação"}</span>
        </div>
        {myReview ? (
          <>
            <div className="book-detail-review-note">
              <Star aria-hidden="true" />
              <strong>Nota registrada: {myReview.rating}</strong>
            </div>
            <p>{myReview.comment}</p>
            <small>Atualizado em: {formatDateTimeBr(myReview.updatedAt)}</small>
          </>
        ) : (
          <p className="section-sub">Você ainda não avaliou este livro. Quando terminar, registre uma avaliação para alimentar seu perfil.</p>
        )}
      </article>

      <article className="card aura-panel aura-panel--focus">
        <div className="section-head">
          <h3><WandSparkles aria-hidden="true" /> Próximos passos</h3>
          <span className="kpi">{isFavorite ? "Favorito ativo" : "Exploração"}</span>
        </div>
        <ul className="stacked-list">
          <li className="stacked-list-item">
            <div>
              <strong>{book?.hasPdf ? "Ler no app" : "Ler com progresso"}</strong>
              <p className="section-sub">Continue sua jornada com salvamento de progresso e metas.</p>
            </div>
            <Link to={`/books/${bookId}/read`} className="btn-link">
              Abrir leitura
            </Link>
          </li>
          <li className="stacked-list-item">
            <div>
              <strong>{myReview ? "Atualizar avaliação" : "Registrar avaliação"}</strong>
              <p className="section-sub">Use sua percepção para enriquecer o catálogo social da plataforma.</p>
            </div>
            <Link to={`/reviews?bookId=${bookId}`} className="btn-muted btn-link">
              Abrir reviews
            </Link>
          </li>
        </ul>
      </article>

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <h3><MessageCircle aria-hidden="true" /> O que a comunidade achou</h3>
          <span className="kpi">{communityReviews.length} destaque(s)</span>
        </div>
        {communityReviews.length > 0 ? (
          <>
            {detailInsights.latestCommunityReview ? (
              <p className="book-detail-latest-review">
                Destaque mais recente: <strong>{formatDateTimeBr(detailInsights.latestCommunityReview.updatedAt)}</strong>
              </p>
            ) : null}
            <ul className="stacked-list">
              {communityReviews.map((review, index) => (
                <li key={review.id} className="stacked-list-item">
                  <div>
                    <div className="book-detail-review-title">
                      <strong>Leitor {index + 1}</strong>
                      <span className={review.rating >= 4 ? "favorite-badge" : "import-badge"}>Nota {review.rating}/5</span>
                    </div>
                    <p>{review.comment || "Sem comentário adicional."}</p>
                    <small>Atualizado em: {formatDateTimeBr(review.updatedAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="section-sub">As primeiras opiniões da comunidade aparecerão aqui quando surgirem novas reviews para este livro.</p>
        )}
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Continuar explorando</h3>
          <span className="kpi">{recommendations.length} sugestão(ões)</span>
        </div>
        {recommendations.length > 0 ? (
          <ul className="stacked-list">
            {recommendations.map((item) => (
              <li key={item.id} className="stacked-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p className="section-sub">{item.author || "Autor não informado"}</p>
                  <small>{formatDecimal(item.averageRating)} de média em {item.totalReviews ?? 0} avaliação(ões)</small>
                </div>
                <Link to={`/books/${item.id}`} className="btn-muted btn-link">
                  Ver detalhes
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">As próximas sugestões aparecerão aqui conforme o catálogo e seu uso evoluírem.</p>
        )}
      </article>
    </section>
  );
}
