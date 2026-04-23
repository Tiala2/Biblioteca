import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { BookCover } from "@shared/ui/books/BookCover";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatDateBr, formatDateTimeBr, formatDecimal } from "@shared/lib/formatters";

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
      } catch {
        if (!active) return;
        setBook(null);
        setMyReview(null);
        setCommunityReviews([]);
        setRecommendations([]);
        setError("Nao foi possivel carregar os detalhes do livro.");
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
      { label: "Paginas", value: `${book.numberOfPages}` },
      { label: "Autor", value: book.author || "Autor nao informado" },
      { label: "Origem", value: book.source === "OPEN" ? "Open Library" : "Catalogo local" },
      { label: "ISBN", value: book.isbn || "Nao informado" },
      {
        label: "Publicacao",
        value: book.publicationDate ? formatDateBr(book.publicationDate) : "Nao informada",
      },
    ];
  }, [book]);

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
    } catch {
      showToast("Nao foi possivel atualizar favorito.", "error");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (!bookId) {
    return (
      <StateCard
        title="Livro nao informado"
        message="Abra um livro a partir do catalogo para visualizar os detalhes e os proximos passos."
        variant="error"
      />
    );
  }

  if (loading) {
    return (
      <StateCard
        title="Detalhes em carregamento"
        message="Estamos preparando os dados do livro, suas acoes rapidas e as sugestoes relacionadas."
        variant="loading"
      />
    );
  }

  return (
    <section className="grid">
      <article className="card hero">
        {book && <BookCover title={book.title} coverUrl={book.coverUrl} size="large" />}
        <div className="section-head">
          <div>
            <h2>{book?.title ?? "Detalhes do livro"}</h2>
            <p>
              Consulte dados do catalogo, sinais de engajamento e seu contexto pessoal antes de mergulhar na leitura.
            </p>
          </div>
          <span className="kpi">{book?.hasPdf ? "PDF local" : "Leitura com progresso"}</span>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="stats-grid">
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
            onClick={toggleFavorite}
            disabled={!headers || favoriteLoading}
          >
            {favoriteLoading ? "Salvando..." : isFavorite ? "Nos favoritos" : "Salvar nos favoritos"}
          </button>
          <Link to={`/reviews?bookId=${bookId}`} className="btn-muted btn-link">
            Ver reviews
          </Link>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Recepcao do catalogo</h3>
          <span className="kpi">
            {formatDecimal(book?.averageRating)} / {book?.totalReviews ?? 0} review(s)
          </span>
        </div>
        <p className="section-sub">
          Use essa leitura guiada para decidir se o livro entra na sua jornada atual ou fica para uma proxima meta.
        </p>
        <div className="stacked-list">
          <div className="stacked-list-item">
            <strong>Categorias</strong>
            <span>{book?.categories?.length ? book.categories.map((item) => item.name).join(", ") : "Sem categorias"}</span>
          </div>
          <div className="stacked-list-item">
            <strong>Tags</strong>
            <span>{book?.tags?.length ? book.tags.map((item) => item.name).join(", ") : "Sem tags"}</span>
          </div>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Seu contexto</h3>
          <span className="kpi">{myReview ? "Com review" : "Sem review"}</span>
        </div>
        {myReview ? (
          <>
            <p>Nota registrada: {myReview.rating}</p>
            <p>{myReview.comment}</p>
            <small>Atualizado em: {formatDateTimeBr(myReview.updatedAt)}</small>
          </>
        ) : (
          <p className="section-sub">Voce ainda nao avaliou este livro. Quando terminar, registre uma review para alimentar seu perfil.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Proximos passos</h3>
          <span className="kpi">{isFavorite ? "Favorito ativo" : "Exploracao"}</span>
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
              <strong>{myReview ? "Atualizar review" : "Registrar review"}</strong>
              <p className="section-sub">Use sua percepcao para enriquecer o catalogo social da plataforma.</p>
            </div>
            <Link to={`/reviews?bookId=${bookId}`} className="btn-muted btn-link">
              Abrir reviews
            </Link>
          </li>
        </ul>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>O que a comunidade achou</h3>
          <span className="kpi">{communityReviews.length} destaque(s)</span>
        </div>
        {communityReviews.length > 0 ? (
          <ul className="stacked-list">
            {communityReviews.map((review, index) => (
              <li key={review.id} className="stacked-list-item">
                <div>
                  <strong>Leitor {index + 1}</strong>
                  <p className="section-sub">Nota: {review.rating}/5</p>
                  <p>{review.comment || "Sem comentario adicional."}</p>
                  <small>Atualizado em: {formatDateTimeBr(review.updatedAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">As primeiras opinioes da comunidade aparecerao aqui quando surgirem novas reviews para este livro.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Continuar explorando</h3>
          <span className="kpi">{recommendations.length} sugestao(oes)</span>
        </div>
        {recommendations.length > 0 ? (
          <ul className="stacked-list">
            {recommendations.map((item) => (
              <li key={item.id} className="stacked-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p className="section-sub">{item.author || "Autor nao informado"}</p>
                  <small>{formatDecimal(item.averageRating)} de media em {item.totalReviews ?? 0} review(s)</small>
                </div>
                <Link to={`/books/${item.id}`} className="btn-muted btn-link">
                  Ver detalhes
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">As proximas sugestoes aparecerao aqui conforme o catalogo e seu uso evoluirem.</p>
        )}
      </article>
    </section>
  );
}
