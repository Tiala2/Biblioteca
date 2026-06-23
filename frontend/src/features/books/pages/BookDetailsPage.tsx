import { useEffect, useMemo, useState } from "react";
import { BookMarked, BookOpen, Heart, MessageCircle, Sparkles, Star, Tags, WandSparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { BookCover } from "@shared/ui/books/BookCover";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatDateBr, formatDateTimeBr, formatDecimal, formatInteger } from "@shared/lib/formatters";
import { formatBookSource, formatReadingMode, pluralizePt } from "@shared/lib/presentation";

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
  source?: "LOCAL" | "OPEN" | "GUTENBERG";
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
      { label: "Origem", value: formatBookSource(book.source) },
      { label: "Experiência", value: book.hasNarrative ? "Experiência narrativa" : "Leitura guiada" },
      {
        label: "Ano de publicação",
        value: book.publicationDate ? formatDateBr(book.publicationDate) : "Data não cadastrada",
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
        showToast("Livro removido da estante.", "success");
      } else {
        await api.post("/api/v1/users/me/favorites", { bookId }, { headers });
        setIsFavorite(true);
        showToast("Livro adicionado à estante.", "success");
      }
    } catch (error) {
      showToast(extractApiErrorMessage(error, "Não foi possível atualizar sua estante."), "error");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (!bookId) {
    return (
      <StateCard
        title="Livro não informado"
        message="Abra um livro a partir da biblioteca para visualizar detalhes e próximos passos."
        variant="error"
      />
    );
  }

  if (loading) {
    return (
      <StateCard
        title="Informações do livro em carregamento"
        message="Estamos preparando os dados do livro, suas ações rápidas e as sugestões relacionadas."
        variant="loading"
      />
    );
  }

  const reviewActionUrl = myReview?.id
    ? `/reviews?editReview=${myReview.id}`
    : `/reviews?bookId=${bookId}&action=create`;

  return (
    <section className="grid aura-page">
      <article className="card hero aura-hero aura-book-detail-hero">
        <div className="aura-book-detail-hero__cover">
          {book && <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="large" />}
        </div>
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Detalhes do livro</p>
            <h2>{book?.title ?? "Informações do livro"}</h2>
            <p>
              Conheça mais sobre a obra antes de começar sua leitura.
            </p>
          </div>
          <div className="aura-hero__signal">
            <BookMarked aria-hidden="true" />
            <strong>{book?.hasPdf ? "Leitura integrada" : "Atualização manual"}</strong>
            <span>{book?.hasPdf ? "no Library" : "com progresso"}</span>
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
        <div className="card-actions book-detail-actions">
          <Link to={`/books/${bookId}/read`} className="btn-link">
            <BookOpen aria-hidden="true" />
            Começar leitura
          </Link>
          <button
            type="button"
            className={isFavorite ? "favorite-toggle active" : "favorite-toggle"}
            aria-pressed={isFavorite}
            onClick={toggleFavorite}
            disabled={!headers || favoriteLoading}
          >
            <Heart aria-hidden="true" />
            {favoriteLoading ? "Salvando..." : isFavorite ? "Na estante" : "Adicionar à estante"}
          </button>
          <Link to={reviewActionUrl} className="btn-muted btn-link">
            <MessageCircle aria-hidden="true" />
            {myReview ? "Atualizar avaliação" : "Avaliar livro"}
          </Link>
        </div>
        <div className="book-detail-insights">
          <div className="stat-box">
            <strong>{formatBookSource(book?.source)}</strong>
            <span>origem</span>
          </div>
          <div className="stat-box">
            <strong>{formatReadingMode(book?.hasPdf, book?.source)}</strong>
            <span>modo de leitura</span>
          </div>
          <div className="stat-box">
            <strong>{isFavorite ? "Na estante" : "Disponível"}</strong>
            <span>Na estante</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Star aria-hidden="true" /> Avaliação dos leitores</h3>
          <span className="kpi">
            {formatDecimal(book?.averageRating)} • {pluralizePt(book?.totalReviews ?? 0, "avaliação", "avaliações")}
          </span>
        </div>
        <div className="rating-summary" aria-label={`Avaliação média ${formatDecimal(book?.averageRating)} de 5`}>
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
            <span>Categorias cadastradas</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(detailInsights.tagCount)}</strong>
            <span>Etiquetas cadastradas</span>
          </div>
          <div className="stat-box">
            <strong>{formatDecimal(detailInsights.communityAverage)}</strong>
            <span>avaliação média</span>
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
              <p className="section-sub">Nenhuma categoria cadastrada para este livro.</p>
            )}
          </div>
          <div>
            <strong><Tags aria-hidden="true" /> Etiquetas</strong>
            {book?.tags?.length ? (
              <div className="taxonomy-chip-row">
                {book.tags.map((item) => (
                  <Link key={item.id} className="taxonomy-chip taxonomy-chip--tag" to={`/books?tagId=${item.id}`}>
                    {item.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="section-sub">Nenhuma etiqueta cadastrada para este livro.</p>
            )}
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Sparkles aria-hidden="true" /> Sua avaliação</h3>
          <span className="kpi">{myReview ? "Avaliado" : "Sem avaliação"}</span>
        </div>
        {myReview ? (
          <>
            <div className="book-detail-review-note">
              <Star aria-hidden="true" />
              <strong>Sua nota: {myReview.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</strong>
            </div>
            <p>{myReview.comment}</p>
            <small>Atualizado em {formatDateTimeBr(myReview.updatedAt)}</small>
          </>
        ) : (
          <>
            <p className="section-sub">Você ainda não avaliou este livro. Quando terminar, registre uma avaliação para alimentar seu perfil.</p>
            <div className="card-actions">
              <Link to={reviewActionUrl} className="btn-link">
                <MessageCircle aria-hidden="true" />
                Avaliar livro
              </Link>
            </div>
          </>
        )}
      </article>

      <article className="card aura-panel aura-panel--focus">
        <div className="section-head">
          <h3><WandSparkles aria-hidden="true" /> Continue sua leitura</h3>
          <span className="kpi">{isFavorite ? "Na estante" : "Exploração"}</span>
        </div>
        <ul className="stacked-list">
          <li className="stacked-list-item">
            <div>
              <strong>{book?.hasPdf ? "Leitura integrada" : "Atualização manual"}</strong>
              <p className="section-sub">Continue sua jornada com salvamento de progresso e metas.</p>
            </div>
            <Link to={`/books/${bookId}/read`} className="btn-link">
              <BookOpen aria-hidden="true" />
              Começar leitura
            </Link>
          </li>
          <li className="stacked-list-item">
            <div>
              <strong>{myReview ? "Atualizar avaliação" : "Avaliar livro"}</strong>
              <p className="section-sub">Use sua percepção para registrar o que ficou da leitura.</p>
            </div>
            <Link to={reviewActionUrl} className="btn-muted btn-link">
              <MessageCircle aria-hidden="true" />
              {myReview ? "Atualizar avaliação" : "Avaliar livro"}
            </Link>
          </li>
        </ul>
      </article>

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <h3><MessageCircle aria-hidden="true" /> O que os leitores acharam</h3>
          <span className="kpi">{pluralizePt(communityReviews.length, "avaliação", "avaliações")}</span>
        </div>
        {communityReviews.length > 0 ? (
          <>
            {detailInsights.latestCommunityReview ? (
              <p className="book-detail-latest-review">
                Avaliação mais recente: <strong>{formatDateTimeBr(detailInsights.latestCommunityReview.updatedAt)}</strong>
              </p>
            ) : null}
            <ul className="stacked-list">
              {communityReviews.map((review, index) => (
                <li key={review.id} className="stacked-list-item">
                  <div>
                    <div className="book-detail-review-title">
                      <strong>Leitor {index + 1}</strong>
                      <span className={review.rating >= 4 ? "favorite-badge" : "import-badge"}>⭐ {review.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
                    </div>
                    <p>{review.comment || "O leitor registrou apenas a avaliação, sem comentário adicional."}</p>
                    <small>Atualizado em {formatDateTimeBr(review.updatedAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="section-sub">As primeiras opiniões dos leitores aparecerão aqui quando surgirem novas avaliações para este livro.</p>
            <div className="card-actions">
              <Link to={reviewActionUrl} className="btn-muted btn-link">
                <MessageCircle aria-hidden="true" />
                Registrar percepção
              </Link>
            </div>
          </>
        )}
      </article>

      <article className="card aura-panel book-detail-suggestions-panel">
        <div className="section-head">
          <h3>Sugestões de leitura</h3>
          <span className="kpi">{pluralizePt(recommendations.length, "sugestão", "sugestões")}</span>
        </div>
        {recommendations.length > 0 ? (
          <ul className="stacked-list">
            {recommendations.map((item) => (
              <li key={item.id} className="stacked-list-item book-detail-recommendation-row">
                <div>
                  <Link to={`/books/${item.id}`} className="text-link">
                    <strong>{item.title}</strong>
                  </Link>
                  <p className="section-sub">{item.author || "Autor não informado"}</p>
                  <small>{formatDecimal(item.averageRating)} em {pluralizePt(item.totalReviews ?? 0, "avaliação", "avaliações")}</small>
                </div>
                <Link to={`/books/${item.id}`} className="btn-muted btn-link">
                  Ver livro
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="section-sub">As próximas sugestões aparecerão aqui conforme a biblioteca e seu uso evoluírem.</p>
            <div className="card-actions">
              <Link to="/books" className="btn-muted btn-link">
                Explorar livros
              </Link>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
