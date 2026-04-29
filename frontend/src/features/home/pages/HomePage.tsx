import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuth } from "@features/auth/context/AuthContext";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";

type HomeBook = {
  id: string;
  title: string;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
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

export function HomePage() {
  const { auth } = useAuth();
  const [home, setHome] = useState<HomeResponse>(EMPTY_HOME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.token) {
      return;
    }

    const headers = { Authorization: `Bearer ${auth.token}` };

    const loadHome = async () => {
      setLoading(true);
      try {
        const response = await api.get<HomeResponse>("/api/v1/home/resume", { headers });
        setHome(response.data);
        setError("");
      } catch (error) {
        setHome(EMPTY_HOME);
        setError(extractApiErrorMessage(error, "Nao foi possivel carregar o painel inicial."));
      } finally {
        setLoading(false);
      }
    };

    void loadHome();
  }, [auth?.token]);

  const currentReading = home.readings[0];
  const progressPercent = Math.max(0, Math.min(100, Number(home.readingProgress.goal?.progressPercent ?? 0)));

  if (loading) {
    return (
      <StateCard
        title="Painel inicial em carregamento"
        message="Estamos preparando seu resumo de leitura, metas e recomendacoes."
        variant="loading"
      />
    );
  }

  if (error) {
    return (
      <StateCard
        title="Nao foi possivel carregar o painel"
        message={error}
        variant="error"
        action={
          <Link to="/books" className="btn-link">
            Ir para o catalogo
          </Link>
        }
      />
    );
  }

  return (
    <section className="grid">
      <article className="card hero">
        <div className="section-head">
          <div>
            <h2>Bem-vinda, {auth?.name}</h2>
            <p>
              Seu painel reune leitura atual, metas, recomendacoes e sinais de engajamento em um unico lugar.
            </p>
          </div>
          <span className="kpi">{home.readingProgress.streakDays} dia(s) de streak</span>
        </div>

        <div className="card-actions">
          <Link to="/profile" className="btn-link">
            Abrir perfil
          </Link>
          <Link to="/books" className="btn-link">
            Explorar catalogo
          </Link>
          <Link to="/goals" className="btn-link">
            Ver metas
          </Link>
          <Link to="/leaderboard" className="btn-link">
            Abrir ranking
          </Link>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Resumo da conta</h3>
          <span className="kpi">{home.userSummary.totalPagesRead} pags lidas</span>
        </div>
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{home.userSummary.totalInProgress}</strong>
            <span>leituras em andamento</span>
          </div>
          <div className="stat-box">
            <strong>{home.userSummary.totalFinished}</strong>
            <span>livros concluidos</span>
          </div>
          <div className="stat-box">
            <strong>{home.readingProgress.pagesReadThisWeek}</strong>
            <span>pags nesta semana</span>
          </div>
          <div className="stat-box">
            <strong>{home.readingProgress.sessionsThisWeek}</strong>
            <span>sessoes de leitura</span>
          </div>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Leitura atual</h3>
          <span className="kpi">
            {currentReading ? `${currentReading.progress}% concluido` : "Sem leitura ativa"}
          </span>
        </div>
        {currentReading ? (
          <>
            <div className="inline-book-row">
              <BookCover title={currentReading.book.title} coverUrl={currentReading.book.coverUrl} size="small" />
              <div>
                <p><strong>{currentReading.book.title}</strong></p>
                {currentReading.book.source === "OPEN" && <p className="section-sub">Origem: Open Library</p>}
                <p className="section-sub">
                  Pagina atual: {currentReading.currentPage} | Status: {currentReading.status}
                </p>
              </div>
            </div>
            <div className="progress-track" aria-hidden="true">
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

      <article className="card">
        <div className="section-head">
          <h3>Meta atual</h3>
          <span className="kpi">
            {home.readingProgress.goal ? `${progressPercent}%` : "Sem meta"}
          </span>
        </div>
        {home.readingProgress.goal ? (
          <>
            <p>
              {home.readingProgress.goal.progressPages} de {home.readingProgress.goal.targetPages} paginas concluida(s)
            </p>
            <p className="section-sub">
              Restam {home.readingProgress.goal.remainingPages} paginas | Status: {home.readingProgress.goal.status}
            </p>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        ) : (
          <p className="section-sub">Crie uma meta para acompanhar o desempenho de leitura.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Recomendacoes</h3>
          <span className="kpi">{home.recommendations.length} destaque(s)</span>
        </div>
        {home.recommendations.length > 0 ? (
          <ul className="stacked-list">
            {home.recommendations.slice(0, 4).map((book) => (
              <li key={book.id} className="stacked-list-item">
                <BookCover title={book.title} coverUrl={book.coverUrl} size="small" />
                <div>
                  <strong>{book.title}</strong>
                  {book.source === "OPEN" && <p className="section-sub">Origem: Open Library</p>}
                  <p className="section-sub">
                    Nota {Number(book.averageRating ?? 0).toFixed(1)}
                  </p>
                </div>
                <Link to={`/books/${book.id}`} className="btn-muted btn-link">
                  Ver detalhes
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">As recomendacoes aparecerao aqui quando houver mais dados de uso.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Colecoes em destaque</h3>
          <span className="kpi">{home.collections.length} colecao(oes)</span>
        </div>
        {home.collections.length > 0 ? (
          <ul className="stacked-list">
            {home.collections.slice(0, 3).map((collection) => (
              <li key={collection.id} className="stacked-list-item">
                <div>
                  <strong>{collection.title}</strong>
                  <p className="section-sub">
                    {collection.books?.length ?? 0} livro(s) relacionado(s)
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Nenhuma colecao disponivel para mostrar agora.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Avaliacoes recentes</h3>
          <span className="kpi">{home.recentReviews.length} item(ns)</span>
        </div>
        {home.recentReviews.length > 0 ? (
          <ul className="stacked-list">
            {home.recentReviews.slice(0, 4).map((review, index) => (
              <li key={`${review.bookTitle}-${index}`} className="stacked-list-item">
                <div>
                  <strong>{review.bookTitle}</strong>
                  <p className="section-sub">Nota registrada: {review.rating}/5</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Suas proximas avaliacoes aparecerao aqui.</p>
        )}
      </article>
    </section>
  );
}
