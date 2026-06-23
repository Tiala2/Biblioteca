import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronRight, Flame, LibraryBig, Sparkles, Star, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatBookSource, formatReadingStatus, pluralizePt } from "@shared/lib/presentation";

type HomeBook = {
  id: string;
  title: string;
  isbn?: string | null;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN" | "GUTENBERG";
  favorite?: boolean;
  numberOfPages?: number;
  averageRating?: number | null;
};

type HomeReading = {
  id: string;
  status: string;
  currentPage: number;
  progress: number;
  book: HomeBook;
};

type GoalSummary = {
  targetPages: number;
  progressPages: number;
  progressPercent: number;
  remainingPages: number;
  status: string;
};

type ReadingProgress = {
  goal?: GoalSummary | null;
  streakDays: number;
  pagesReadThisWeek: number;
  sessionsThisWeek: number;
  lastSessionAt?: string | null;
};

type Collection = {
  id: string;
  title: string;
  description?: string;
  books?: HomeBook[];
};

type Review = {
  bookTitle: string;
  bookIsbn?: string | null;
  bookCoverUrl?: string | null;
  rating: number;
};

type UserSummary = {
  totalInProgress: number;
  totalFinished: number;
  totalPagesRead: number;
};

type HomeResponse = {
  userSummary: UserSummary;
  readings: HomeReading[];
  readingProgress: ReadingProgress;
  collections: Collection[];
  recommendations: HomeBook[];
  recentReviews: Review[];
};

const FRIENDLY_COLLECTION_NAMES = [
  "Fantasia épica",
  "Distopias essenciais",
  "Clássicos para começar",
  "Leituras curtas",
  "Jornadas marcantes",
  "Preferidos dos leitores",
];

function getFriendlyCollectionTitle(collection: Collection, index: number) {
  const title = collection.title?.trim();
  const looksTechnical =
    !title ||
    /route|post|debug|teste|test/i.test(title) ||
    /^[a-z]+[-_][a-z0-9-_]+$/i.test(title);

  return looksTechnical ? FRIENDLY_COLLECTION_NAMES[index % FRIENDLY_COLLECTION_NAMES.length] : title;
}

const EMPTY_HOME: HomeResponse = {
  userSummary: {
    totalInProgress: 0,
    totalFinished: 0,
    totalPagesRead: 0,
  },
  readings: [],
  readingProgress: {
    goal: null,
    streakDays: 0,
    pagesReadThisWeek: 0,
    sessionsThisWeek: 0,
    lastSessionAt: null,
  },
  collections: [],
  recommendations: [],
  recentReviews: [],
};

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

export function HomePage() {
  const headers = useAuthHeaders();
  const [home, setHome] = useState<HomeResponse>(EMPTY_HOME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!headers) {
      return;
    }

    const loadHome = async () => {
      setLoading(true);
      try {
        const response = await api.get<HomeResponse>("/api/v1/home/resume", { headers });
        setHome(response.data);
        setError("");
      } catch (error) {
        setHome(EMPTY_HOME);
        setError(extractApiErrorMessage(error, "Não foi possível carregar o painel inicial."));
      } finally {
        setLoading(false);
      }
    };

    void loadHome();
  }, [headers]);

  const currentReading = home.readings[0];
  const progressPercent = Math.max(0, Math.min(100, Number(home.readingProgress.goal?.progressPercent ?? 0)));
  const recommendationInsights = useMemo(() => {
    const openCount = home.recommendations.filter((book) => book.source === "OPEN").length;
    const gutenbergCount = home.recommendations.filter((book) => book.source === "GUTENBERG").length;
    const localCount = home.recommendations.length - openCount - gutenbergCount;
    const ratedBooks = home.recommendations.filter((book) => typeof book.averageRating === "number");
    const averageRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce((total, book) => total + Number(book.averageRating ?? 0), 0) / ratedBooks.length
        : 0;

    return { averageRating, gutenbergCount, localCount, openCount };
  }, [home.recommendations]);
  const collectionInsights = useMemo(() => {
    const totalBooks = home.collections.reduce((total, collection) => total + (collection.books?.length ?? 0), 0);
    const largestIndex = home.collections.reduce((currentIndex, collection, index) => {
      if (currentIndex < 0) return index;
      return (collection.books?.length ?? 0) > (home.collections[currentIndex].books?.length ?? 0) ? index : currentIndex;
    }, -1);
    const largestTitle =
      largestIndex >= 0 ? getFriendlyCollectionTitle(home.collections[largestIndex], largestIndex) : "Ainda sem destaque";

    return { largestTitle, totalBooks };
  }, [home.collections]);

  if (loading) {
    return (
      <StateCard
        title="Painel inicial em carregamento"
        message="Estamos preparando seu resumo de leitura, metas e recomendações."
        variant="loading"
      />
    );
  }

  if (error) {
    return (
      <StateCard
        title="Não foi possível carregar o painel"
        message={error}
        variant="error"
        action={
          <Link to="/books" className="btn-link">
            Ir para o catálogo
          </Link>
        }
      />
    );
  }

  return (
    <section className="grid aura-page aura-home-page">
      <article className="card hero aura-hero aura-hero--home">
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Library</p>
            <h2>Continue sua jornada de leitura</h2>
            <p>
              Acompanhe seu progresso, descubra novas histórias e alcance suas metas de leitura.
            </p>
          </div>
          <div className="aura-hero__signal">
            <Flame aria-hidden="true" />
            <strong>{home.readingProgress.streakDays}</strong>
            <span>{home.readingProgress.streakDays === 1 ? "dia de sequência" : "dias de sequência"}</span>
          </div>
        </div>

        <div className="card-actions aura-actions">
          <Link to={currentReading ? `/books/${currentReading.book.id}/read` : "/books"} className="btn-link">
            {currentReading ? "Continuar leitura" : "Explorar livros"}
          </Link>
          {currentReading ? (
            <Link to={`/books/${currentReading.book.id}`} className="btn-muted btn-link">
              Ver detalhes
            </Link>
          ) : (
            <Link to="/goals?action=config" className="btn-muted btn-link">
              Definir meta
            </Link>
          )}
        </div>
      </article>

      <article className="card aura-panel aura-home-stats-panel">
        <div className="section-head">
          <h3><Sparkles aria-hidden="true" /> Resumo da sua atividade</h3>
          <span className="kpi">{home.userSummary.totalPagesRead} páginas lidas</span>
        </div>
        <div className="stats-grid aura-stats">
          <div className="stat-box">
            <BookOpen aria-hidden="true" />
            <strong>{home.userSummary.totalInProgress}</strong>
            <span>Livros em andamento</span>
          </div>
          <div className="stat-box">
            <Trophy aria-hidden="true" />
            <strong>{home.userSummary.totalFinished}</strong>
            <span>Livros concluídos</span>
          </div>
          <div className="stat-box">
            <Target aria-hidden="true" />
            <strong>{home.readingProgress.pagesReadThisWeek}</strong>
            <span>Páginas lidas</span>
          </div>
          <div className="stat-box">
            <Flame aria-hidden="true" />
            <strong>{home.readingProgress.sessionsThisWeek}</strong>
            <span>Sessões</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel aura-panel--focus aura-home-reading-panel">
        <div className="section-head">
          <h3>Continuar leitura</h3>
          <span className="kpi">
            {currentReading ? `${currentReading.progress}% lido` : "Sem leitura ativa"}
          </span>
        </div>
        {currentReading ? (
          <>
            <div className="inline-book-row">
              <BookCover
                title={currentReading.book.title}
                coverUrl={currentReading.book.coverUrl}
                isbn={currentReading.book.isbn}
                size="small"
              />
              <div>
                <p><strong>{currentReading.book.title}</strong></p>
                {currentReading.book.source !== "LOCAL" && <p className="section-sub">Origem: {formatBookSource(currentReading.book.source)}</p>}
                <p className="section-sub">
                  Página {currentReading.currentPage} · {formatReadingStatus(currentReading.status)}
                </p>
              </div>
            </div>
            <div className="progress-track aura-progress" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${currentReading.progress}%` }} />
            </div>
            <div className="card-actions">
              <Link to={`/books/${currentReading.book.id}/read`} className="btn-link">
                Continuar leitura
              </Link>
              <Link to={`/books/${currentReading.book.id}`} className="btn-muted btn-link">
                Ver detalhes
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="section-sub">Nenhuma leitura em andamento no momento.</p>
            <div className="card-actions">
              <Link to="/books" className="btn-link">
                Escolher leitura
              </Link>
            </div>
          </>
        )}
      </article>

      <article className="card aura-panel aura-home-goal-panel">
        <div className="section-head">
          <h3>Meta de leitura</h3>
          <span className="kpi">
            {home.readingProgress.goal ? `${progressPercent}%` : "Nenhuma meta ativa"}
          </span>
        </div>
        {home.readingProgress.goal ? (
          <>
            <p>
              {home.readingProgress.goal.progressPages} de {home.readingProgress.goal.targetPages} páginas lidas
            </p>
            <p className="section-sub">
              Faltam {home.readingProgress.goal.remainingPages} páginas · {formatReadingStatus(home.readingProgress.goal.status)}
            </p>
            <div className="progress-track aura-progress" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="card-actions">
              <Link to="/goals?action=config" className="btn-muted btn-link">
                Ajustar meta
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="section-sub">Defina um objetivo mensal e acompanhe sua evolução.</p>
            <div className="card-actions">
              <Link to="/goals?action=config" className="btn-link">
                Definir meta
              </Link>
            </div>
          </>
        )}
      </article>

      <article className="card aura-panel aura-panel--wide aura-home-recommendations-panel">
        <div className="section-head">
          <h3><LibraryBig aria-hidden="true" /> Sugestões para você</h3>
          <span className="kpi">{pluralizePt(home.recommendations.length, "sugestão", "sugestões")}</span>
        </div>
        {home.recommendations.length > 0 ? (
          <>
            <div className="home-recommendation-insights">
              <div className="stat-box">
                <strong>{recommendationInsights.localCount}</strong>
                <span>{recommendationInsights.localCount === 1 ? "livro disponível" : "livros disponíveis"}</span>
              </div>
              <div className="stat-box">
                <strong>{recommendationInsights.openCount}</strong>
                <span>Open Library</span>
              </div>
              <div className="stat-box">
                <strong>{recommendationInsights.gutenbergCount}</strong>
                <span>Projeto Gutenberg</span>
              </div>
              <div className="stat-box">
                <strong>
                  {recommendationInsights.averageRating.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </strong>
                <span>avaliação média</span>
              </div>
            </div>
            <ul className="home-recommendation-rail">
              {home.recommendations.slice(0, 6).map((book) => (
                <li key={book.id} className="home-recommendation-card">
                  <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
                  <div>
                    <div className="home-recommendation-title-row">
                      <strong>{book.title}</strong>
                      {book.favorite && <span className="sr-only">Na estante</span>}
                    </div>
                    <p className="section-sub">
                      ⭐{" "}
                      {Number(book.averageRating ?? 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      {book.numberOfPages ? ` · ${book.numberOfPages} páginas` : ""}
                    </p>
                  </div>
                  <Link to={`/books/${book.id}`} className="btn-muted btn-link">
                    Ver detalhes <ChevronRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="section-sub">As recomendações aparecerão aqui quando houver mais dados de uso.</p>
        )}
      </article>

      <article className="card aura-panel aura-home-collections-panel">
        <div className="section-head">
          <h3>Coleções recomendadas</h3>
          <span className="kpi">{pluralizePt(home.collections.length, "coleção", "coleções")}</span>
        </div>
        {home.collections.length > 0 ? (
          <>
            <div className="home-collection-insights">
              <div className="stat-box">
                <strong>{home.collections.length}</strong>
                <span>coleções</span>
              </div>
              <div className="stat-box">
                <strong>{collectionInsights.totalBooks}</strong>
                <span>livros reunidos</span>
              </div>
              <div className="stat-box">
                <strong>{collectionInsights.largestTitle}</strong>
                <span>Coleção principal</span>
              </div>
            </div>
            <ul className="stacked-list">
              {home.collections.slice(0, 3).map((collection, index) => {
                const firstBook = collection.books?.[0];
                const collectionTitle = getFriendlyCollectionTitle(collection, index);
                const collectionDescription = collection.description?.trim();
                const showDescription = collectionDescription && collectionDescription.toLowerCase() !== "x";
                return (
                  <li key={collection.id} className="stacked-list-item home-collection-row">
                    <div className="book-list-row">
                      <BookCover
                        title={collectionTitle}
                        coverUrl={firstBook?.coverUrl}
                        isbn={firstBook?.isbn}
                        size="small"
                      />
                      <div>
                        <strong>{collectionTitle}</strong>
                        <p className="section-sub">
                          {pluralizePt(collection.books?.length ?? 0, "livro nesta coleção", "livros nesta coleção")}
                        </p>
                        {showDescription && <p className="section-sub">{collectionDescription}</p>}
                        {(collection.books?.length ?? 0) > 0 && (
                          <small>{collection.books?.slice(0, 2).map((book) => book.title).join(", ")}</small>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="section-sub">Nenhuma coleção disponível para mostrar agora.</p>
        )}
      </article>

      <article className="card aura-panel aura-home-reviews-panel">
        <div className="section-head">
          <h3>Últimas avaliações</h3>
          <span className="kpi">{pluralizePt(home.recentReviews.length, "avaliação", "avaliações")}</span>
        </div>
        {home.recentReviews.length > 0 ? (
          <ul className="stacked-list">
            {home.recentReviews.slice(0, 4).map((review, index) => (
              <li key={`${review.bookTitle}-${index}`} className="stacked-list-item home-review-row">
                <BookCover title={review.bookTitle} coverUrl={review.bookCoverUrl} isbn={review.bookIsbn} size="small" />
                <div className="home-review-content">
                  <strong>{review.bookTitle}</strong>
                  <p className="aura-rating"><RatingStars value={review.rating} /> ⭐ {review.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Suas próximas avaliações aparecerão aqui.</p>
        )}
      </article>
    </section>
  );
}
