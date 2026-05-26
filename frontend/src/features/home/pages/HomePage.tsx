import { useEffect, useMemo, useState } from "react";
import { BookOpen, Flame, LibraryBig, Sparkles, Star, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuth } from "@features/auth/context/AuthContext";
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

export function HomePage() {
  const { auth } = useAuth();
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
    const localCount = home.recommendations.length - openCount;
    const ratedBooks = home.recommendations.filter((book) => typeof book.averageRating === "number");
    const averageRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce((total, book) => total + Number(book.averageRating ?? 0), 0) / ratedBooks.length
        : 0;

    return { averageRating, localCount, openCount };
  }, [home.recommendations]);
  const collectionInsights = useMemo(() => {
    const totalBooks = home.collections.reduce((total, collection) => total + (collection.books?.length ?? 0), 0);
    const largest = home.collections.reduce<Collection | null>((current, collection) => {
      if (!current) return collection;
      return (collection.books?.length ?? 0) > (current.books?.length ?? 0) ? collection : current;
    }, null);

    return { largest, totalBooks };
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
    <section className="grid aura-page">
      <article className="card hero aura-hero aura-hero--home">
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Library Aura</p>
            <h2>Bem-vinda, {auth?.name}</h2>
            <p>
              Um espaço de leitura com ritmo, conquistas e próximas jornadas prontas para você escolher.
            </p>
          </div>
          <div className="aura-hero__signal">
            <Flame aria-hidden="true" />
            <strong>{home.readingProgress.streakDays}</strong>
            <span>{home.readingProgress.streakDays === 1 ? "dia de sequência" : "dias de sequência"}</span>
          </div>
        </div>

        <div className="card-actions aura-actions">
          <Link to="/profile" className="btn-link">
            Abrir perfil
          </Link>
          <Link to="/books" className="btn-link">
            Explorar catálogo
          </Link>
          <Link to="/goals" className="btn-link">
            Ver metas
          </Link>
          <Link to="/leaderboard" className="btn-link">
            Abrir ranking
          </Link>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Sparkles aria-hidden="true" /> Resumo da conta</h3>
          <span className="kpi">{home.userSummary.totalPagesRead} páginas lidas</span>
        </div>
        <div className="stats-grid aura-stats">
          <div className="stat-box">
            <BookOpen aria-hidden="true" />
            <strong>{home.userSummary.totalInProgress}</strong>
            <span>leituras em andamento</span>
          </div>
          <div className="stat-box">
            <Trophy aria-hidden="true" />
            <strong>{home.userSummary.totalFinished}</strong>
            <span>livros concluídos</span>
          </div>
          <div className="stat-box">
            <Target aria-hidden="true" />
            <strong>{home.readingProgress.pagesReadThisWeek}</strong>
            <span>páginas nesta semana</span>
          </div>
          <div className="stat-box">
            <Flame aria-hidden="true" />
            <strong>{home.readingProgress.sessionsThisWeek}</strong>
            <span>sessões de leitura</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel aura-panel--focus">
        <div className="section-head">
          <h3>Leitura atual</h3>
          <span className="kpi">
            {currentReading ? `${currentReading.progress}% concluído` : "Sem leitura ativa"}
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
                {currentReading.book.source === "OPEN" && <p className="section-sub">Origem: Open Library</p>}
                <p className="section-sub">
                  Página {currentReading.currentPage} · {formatReadingStatus(currentReading.status)}
                </p>
              </div>
            </div>
            <div className="progress-track aura-progress" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${currentReading.progress}%` }} />
            </div>
            <div className="card-actions">
              <Link to={`/books/${currentReading.book.id}`} className="btn-muted btn-link">
                Ver detalhes
              </Link>
              <Link to={`/books/${currentReading.book.id}/read`} className="btn-link">
                Continuar leitura
              </Link>
            </div>
          </>
        ) : (
          <p className="section-sub">Nenhuma leitura em andamento no momento.</p>
        )}
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Meta atual</h3>
          <span className="kpi">
            {home.readingProgress.goal ? `${progressPercent}%` : "Sem meta"}
          </span>
        </div>
        {home.readingProgress.goal ? (
          <>
            <p>
              {home.readingProgress.goal.progressPages} de {home.readingProgress.goal.targetPages} páginas concluídas
            </p>
            <p className="section-sub">
              Faltam {home.readingProgress.goal.remainingPages} páginas · {formatReadingStatus(home.readingProgress.goal.status)}
            </p>
            <div className="progress-track aura-progress" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        ) : (
          <p className="section-sub">Crie uma meta para acompanhar o desempenho de leitura.</p>
        )}
      </article>

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <h3><LibraryBig aria-hidden="true" /> Recomendações</h3>
          <span className="kpi">{pluralizePt(home.recommendations.length, "destaque", "destaques")}</span>
        </div>
        {home.recommendations.length > 0 ? (
          <>
            <div className="home-recommendation-insights">
              <div className="stat-box">
                <strong>{recommendationInsights.localCount}</strong>
                <span>leitura no app</span>
              </div>
              <div className="stat-box">
                <strong>{recommendationInsights.openCount}</strong>
                <span>Open Library</span>
              </div>
              <div className="stat-box">
                <strong>{recommendationInsights.averageRating.toFixed(1)}</strong>
                <span>nota média</span>
              </div>
            </div>
            <ul className="stacked-list aura-book-list">
              {home.recommendations.slice(0, 4).map((book) => (
                <li key={book.id} className="stacked-list-item">
                  <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
                  <div>
                    <div className="home-recommendation-title-row">
                      <strong>{book.title}</strong>
                      <span className={book.source === "OPEN" ? "import-badge" : "status-pill status-pill--muted"}>
                        {formatBookSource(book.source)}
                      </span>
                      {book.favorite && <span className="favorite-badge">Favorito</span>}
                    </div>
                    <p className="section-sub">
                      Nota {Number(book.averageRating ?? 0).toFixed(1)}
                      {book.numberOfPages ? `. ${book.numberOfPages} páginas.` : ""}
                    </p>
                  </div>
                  <Link to={`/books/${book.id}`} className="btn-muted btn-link">
                    Ver detalhes
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="section-sub">As recomendações aparecerão aqui quando houver mais dados de uso.</p>
        )}
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Coleções em destaque</h3>
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
                <strong>{collectionInsights.largest?.title ?? "Ainda sem destaque"}</strong>
                <span>maior coleção</span>
              </div>
            </div>
            <ul className="stacked-list">
              {home.collections.slice(0, 3).map((collection) => {
                const firstBook = collection.books?.[0];
                return (
                  <li key={collection.id} className="stacked-list-item">
                    <div className="book-list-row">
                      <BookCover
                        title={collection.title}
                        coverUrl={firstBook?.coverUrl}
                        isbn={firstBook?.isbn}
                        size="small"
                      />
                      <div>
                        <strong>{collection.title}</strong>
                        <p className="section-sub">
                          {pluralizePt(collection.books?.length ?? 0, "livro relacionado", "livros relacionados")}
                        </p>
                        {collection.description && <p className="section-sub">{collection.description}</p>}
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

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Avaliações recentes</h3>
          <span className="kpi">{pluralizePt(home.recentReviews.length, "item", "itens")}</span>
        </div>
        {home.recentReviews.length > 0 ? (
          <ul className="stacked-list">
            {home.recentReviews.slice(0, 4).map((review, index) => (
              <li key={`${review.bookTitle}-${index}`} className="stacked-list-item home-review-row">
                <BookCover title={review.bookTitle} coverUrl={review.bookCoverUrl} isbn={review.bookIsbn} size="small" />
                <div>
                  <strong>{review.bookTitle}</strong>
                  <p className="aura-rating"><RatingStars value={review.rating} /> Nota {review.rating}</p>
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
