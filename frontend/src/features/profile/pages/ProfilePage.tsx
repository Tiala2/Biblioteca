import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpen, Medal, Settings2, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { formatDateTimeBr, formatDecimal, formatInteger } from "@shared/lib/formatters";
import { formatBookSource, formatReadingStatus, pluralizePt } from "@shared/lib/presentation";
import { BookCover } from "@shared/ui/books/BookCover";
import { StateCard } from "@shared/ui/feedback/StateCard";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  awardedAt: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  leaderboardOptIn: boolean;
  alertsOptIn: boolean;
  badges: Badge[];
};

type HomeBook = {
  id: string;
  title: string;
  isbn?: string | null;
  coverUrl?: string | null;
  source?: "LOCAL" | "OPEN";
};

type Reading = {
  id: string;
  book: HomeBook;
  status: string;
  currentPage: number;
  progress: number;
  lastReadedAt?: string | null;
  finishedAt?: string | null;
};

type Review = {
  id: string;
  bookId: string;
  rating: number;
  comment: string;
  updatedAt: string;
};

type HomeResponse = {
  userSummary: {
    totalInProgress: number;
    totalFinished: number;
    totalPagesRead: number;
  };
  readingProgress: {
    streakDays: number;
    pagesReadThisWeek: number;
    sessionsThisWeek: number;
  };
};

type Paged<T> = { content: T[] };

export function ProfilePage() {
  const headers = useAuthHeaders();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [readingFilter, setReadingFilter] = useState<"ALL" | "IN_PROGRESS" | "FINISHED">("ALL");
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "HIGH" | "LOW">("ALL");
  const [saving, setSaving] = useState(false);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [alertsOptIn, setAlertsOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!headers) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [profileResponse, homeResponse, readingResponse, reviewResponse] = await Promise.all([
          api.get<UserProfile>("/api/v1/users/me", { headers }),
          api.get<HomeResponse>("/api/v1/home/resume", { headers }),
          api.get<Reading[]>("/api/v1/readings/me", { headers }),
          api.get<Paged<Review>>("/api/v1/reviews/me?page=0&size=20", { headers }),
        ]);

        if (!active) return;

        setProfile(profileResponse.data);
        setHome(homeResponse.data);
        setReadings(readingResponse.data);
        setReviews(reviewResponse.data.content);
        setLeaderboardOptIn(Boolean(profileResponse.data.leaderboardOptIn));
        setAlertsOptIn(Boolean(profileResponse.data.alertsOptIn));
        setError("");
      } catch (error) {
        if (!active) return;
        setError(extractApiErrorMessage(error, "Não foi possível carregar seu perfil."));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [headers]);

  const timeline = useMemo(() => {
    return readings.slice(0, 5).map((reading) => ({
      id: reading.id,
      title: reading.book.title,
      book: reading.book,
      progress: reading.progress,
      subtitle: `Página ${reading.currentPage} · ${reading.progress}% · ${formatReadingStatus(reading.status)}`,
      date: reading.lastReadedAt ?? reading.finishedAt ?? null,
      link: `/books/${reading.book.id}`,
      cta: "Abrir detalhes",
    }));
  }, [readings]);

  const profileInsights = useMemo(() => {
    const totalSessions = home?.readingProgress.sessionsThisWeek ?? 0;
    const totalPagesThisWeek = home?.readingProgress.pagesReadThisWeek ?? 0;
    const highReviews = reviews.filter((review) => review.rating >= 4).length;
    const lowReviews = reviews.filter((review) => review.rating <= 3).length;
    const averageRating =
      reviews.length > 0 ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
    const latestReview =
      [...reviews].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;

    return {
      activeReadings: home?.userSummary.totalInProgress ?? 0,
      averagePagesPerSession: totalSessions > 0 ? totalPagesThisWeek / totalSessions : 0,
      averageRating,
      highReviews,
      latestReview,
      lowReviews,
      pagesThisWeek: totalPagesThisWeek,
      totalBadges: profile?.badges.length ?? 0,
      recentBadges: [...(profile?.badges ?? [])].slice(0, 3),
    };
  }, [home, profile, reviews]);

  const filteredTimeline = useMemo(() => {
    return timeline.filter((item) => {
      if (readingFilter === "ALL") return true;
      return item.subtitle.includes(readingFilter);
    });
  }, [readingFilter, timeline]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (reviewFilter === "HIGH") return review.rating >= 4;
      if (reviewFilter === "LOW") return review.rating <= 3;
      return true;
    });
  }, [reviewFilter, reviews]);
  const readingBookById = useMemo(
    () => Object.fromEntries(readings.map((reading) => [reading.book.id, reading.book])),
    [readings]
  );

  const onSavePreferences = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !profile) return;

    setSaving(true);
    try {
      await api.put(
        "/api/v1/users/me",
        {
          name: profile.name,
          email: profile.email,
          leaderboardOptIn,
          alertsOptIn,
        },
        { headers }
      );
      setProfile((previous) =>
        previous
          ? {
              ...previous,
              leaderboardOptIn,
              alertsOptIn,
            }
          : previous
      );
      setError("");
      showToast("Preferências atualizadas com sucesso.", "success");
    } catch (error) {
      const message = extractApiErrorMessage(error, "Não foi possível salvar suas preferências.");
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StateCard
        title="Perfil em preparação"
        message="Estamos carregando seu histórico, conquistas e preferências para montar sua visão pessoal."
        variant="loading"
      />
    );
  }

  return (
    <section className="grid aura-page">
      <article className="card hero aura-hero aura-hero--profile">
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Identidade leitora</p>
            <h2>Perfil e histórico de leitura</h2>
            <p>
              Seus números, escolhas e registros recentes em uma visão que mostra como seu hábito está crescendo.
            </p>
          </div>
          <div className="aura-hero__signal">
            <UserRound aria-hidden="true" />
            <strong>{profileInsights.totalBadges}</strong>
            <span>{profileInsights.totalBadges === 1 ? "conquista" : "conquistas"}</span>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="stats-grid aura-stats">
          <div className="stat-box">
            <BookOpen aria-hidden="true" />
            <strong>{formatInteger(home?.userSummary.totalPagesRead)}</strong>
            <span>páginas lidas</span>
          </div>
          <div className="stat-box">
            <Sparkles aria-hidden="true" />
            <strong>{formatInteger(home?.userSummary.totalFinished)}</strong>
            <span>livros concluídos</span>
          </div>
          <div className="stat-box">
            <BarChart3 aria-hidden="true" />
            <strong>{formatInteger(home?.readingProgress.streakDays)}</strong>
            <span>dias de streak</span>
          </div>
          <div className="stat-box">
            <Medal aria-hidden="true" />
            <strong>{formatInteger(home?.readingProgress.sessionsThisWeek)}</strong>
            <span>sessões na semana</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Ritmo da semana</h3>
          <span className="kpi">Visão resumida</span>
        </div>
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.activeReadings)}</strong>
            <span>leituras ativas</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.pagesThisWeek)}</strong>
            <span>páginas nesta semana</span>
          </div>
          <div className="stat-box">
            <strong>{formatDecimal(profileInsights.averagePagesPerSession)}</strong>
            <span>média por sessão</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.totalBadges)}</strong>
            <span>conquistas acumuladas</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Settings2 aria-hidden="true" /> Conta</h3>
          <span className="kpi">{pluralizePt(profile?.badges.length ?? 0, "conquista", "conquistas")}</span>
        </div>
        <div className="stacked-list">
          <div className="stacked-list-item">
            <strong>Nome</strong>
            <span>{profile?.name}</span>
          </div>
          <div className="stacked-list-item">
            <strong>Email</strong>
            <span className="email-text">{profile?.email}</span>
          </div>
          <div className="stacked-list-item profile-preference-row">
            <div>
              <strong>Ranking semanal</strong>
              <p className="section-sub">Define se suas leituras entram na classificação pública.</p>
            </div>
            <span className={leaderboardOptIn ? "favorite-badge" : "import-badge"}>
              {leaderboardOptIn ? "Ativo" : "Desligado"}
            </span>
          </div>
          <div className="stacked-list-item profile-preference-row">
            <div>
              <strong>Alertas internos</strong>
              <p className="section-sub">Controla lembretes de ritmo, metas e continuidade.</p>
            </div>
            <span className={alertsOptIn ? "favorite-badge" : "import-badge"}>
              {alertsOptIn ? "Ativo" : "Desligado"}
            </span>
          </div>
        </div>
        <form onSubmit={onSavePreferences}>
          <label className="check-inline">
            <input type="checkbox" checked={leaderboardOptIn} onChange={(event) => setLeaderboardOptIn(event.target.checked)} />
            Participar do ranking semanal
          </label>
          <label className="check-inline">
            <input type="checkbox" checked={alertsOptIn} onChange={(event) => setAlertsOptIn(event.target.checked)} />
            Receber alertas internos de leitura
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar preferências"}
          </button>
        </form>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Ações rápidas</h3>
          <span className="kpi">Atalhos</span>
        </div>
        <div className="quick-links-grid">
          <Link to="/books" className="btn-muted btn-link">
            Explorar catálogo
          </Link>
          <Link to="/goals" className="btn-muted btn-link">
            Revisar metas
          </Link>
          <Link to="/reviews" className="btn-muted btn-link">
            Gerenciar avaliações
          </Link>
          <Link to="/leaderboard" className="btn-muted btn-link">
            Abrir ranking
          </Link>
        </div>
      </article>

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <h3>Histórico recente</h3>
          <span className="kpi">{pluralizePt(filteredTimeline.length, "registro", "registros")}</span>
        </div>
        <select aria-label="Filtrar histórico de leitura" value={readingFilter} onChange={(event) => setReadingFilter(event.target.value as "ALL" | "IN_PROGRESS" | "FINISHED")}>
          <option value="ALL">Todas as leituras</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="FINISHED">Concluídas</option>
        </select>
        {filteredTimeline.length > 0 ? (
          <ul className="stacked-list">
            {filteredTimeline.map((item) => (
              <li key={item.id} className="stacked-list-item">
                <BookCover title={item.book.title} coverUrl={item.book.coverUrl} isbn={item.book.isbn} size="small" />
                <div>
                  <strong>{item.title}</strong>
                  <p className="section-sub">{item.subtitle}</p>
                  <div className="book-card-badges">
                    <span className={item.book.source === "OPEN" ? "import-badge" : "favorite-badge"}>
                      {formatBookSource(item.book.source)}
                    </span>
                    <span className={item.progress >= 100 ? "favorite-badge" : "import-badge"}>
                      {item.progress >= 100 ? "Concluída" : "Em progresso"}
                    </span>
                  </div>
                  <div className="mini-progress" aria-label={`Progresso de ${item.book.title}: ${item.progress}%`}>
                    <span style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
                  </div>
                  <small>{formatDateTimeBr(item.date)}</small>
                </div>
                <Link to={item.link} className="btn-muted btn-link">
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Seu histórico aparecerá aqui assim que você registrar leituras.</p>
        )}
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Conquistas recentes</h3>
          <span className="kpi">{pluralizePt(profileInsights.recentBadges.length, "destaque", "destaques")}</span>
        </div>
        {profileInsights.recentBadges.length > 0 ? (
          <ul className="stacked-list">
            {profileInsights.recentBadges.map((badge) => (
              <li key={badge.id} className="stacked-list-item">
                <div>
                  <strong>{badge.name}</strong>
                  <p className="section-sub">{badge.description}</p>
                  <small>{formatDateTimeBr(badge.awardedAt)}</small>
                </div>
                <Link to="/badges" className="btn-muted btn-link">
                  Abrir conquistas
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Suas próximas conquistas vão aparecer aqui conforme o hábito de leitura evoluir.</p>
        )}
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3>Avaliações recentes</h3>
          <span className="kpi">{pluralizePt(filteredReviews.length, "avaliação", "avaliações")}</span>
        </div>
        <div className="profile-review-insights">
          <div className="stat-box">
            <strong>{formatDecimal(profileInsights.averageRating)}</strong>
            <span>média das notas</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.highReviews)}</strong>
            <span>notas 4 e 5</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.lowReviews)}</strong>
            <span>notas 1 a 3</span>
          </div>
        </div>
        {profileInsights.latestReview ? (
          <p className="profile-review-latest">
            Última avaliação: <strong>{formatDateTimeBr(profileInsights.latestReview.updatedAt)}</strong>
          </p>
        ) : null}
        <select aria-label="Filtrar avaliações por nota" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as "ALL" | "HIGH" | "LOW")}>
          <option value="ALL">Todas as avaliações</option>
          <option value="HIGH">Notas 4 e 5</option>
          <option value="LOW">Notas 1 a 3</option>
        </select>
        {filteredReviews.length > 0 ? (
          <ul className="stacked-list">
            {filteredReviews.slice(0, 5).map((review) => {
              const reviewBook = readingBookById[review.bookId];

              return (
                <li key={review.id} className="stacked-list-item">
                  <div className="book-list-row">
                    <BookCover title={reviewBook?.title ?? "Livro avaliado"} coverUrl={reviewBook?.coverUrl} isbn={reviewBook?.isbn} size="small" />
                    <div>
                      <strong>{reviewBook?.title ?? "Livro avaliado"}</strong>
                      <p className="section-sub">Nota {review.rating}. {review.comment}</p>
                      <small>{formatDateTimeBr(review.updatedAt)}</small>
                    </div>
                  </div>
                  <div className="card-actions">
                    <Link to={`/books/${review.bookId}`} className="btn-muted btn-link">
                      Ver livro
                    </Link>
                    <Link to="/reviews" className="btn-muted btn-link">
                      Abrir avaliações
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="section-sub">Nenhuma avaliação encontrada para esse filtro.</p>
        )}
      </article>
    </section>
  );
}
