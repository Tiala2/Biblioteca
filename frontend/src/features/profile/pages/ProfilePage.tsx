import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuth } from "@features/auth/context/AuthContext";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { formatDateTimeBr, formatDecimal, formatInteger } from "@shared/lib/formatters";
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
  const { auth } = useAuth();
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
        setError(extractApiErrorMessage(error, "Nao foi possivel carregar seu perfil."));
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
      subtitle: `Pagina ${reading.currentPage} - ${reading.progress}% - ${reading.status}`,
      date: reading.lastReadedAt ?? reading.finishedAt ?? null,
      link: `/books/${reading.book.id}`,
      cta: "Abrir detalhes",
    }));
  }, [readings]);

  const profileInsights = useMemo(() => {
    const totalSessions = home?.readingProgress.sessionsThisWeek ?? 0;
    const totalPagesThisWeek = home?.readingProgress.pagesReadThisWeek ?? 0;

    return {
      activeReadings: home?.userSummary.totalInProgress ?? 0,
      averagePagesPerSession: totalSessions > 0 ? totalPagesThisWeek / totalSessions : 0,
      pagesThisWeek: totalPagesThisWeek,
      totalBadges: profile?.badges.length ?? 0,
      recentBadges: [...(profile?.badges ?? [])].slice(0, 3),
    };
  }, [home, profile]);

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
      showToast("Preferencias atualizadas com sucesso.", "success");
    } catch (error) {
      const message = extractApiErrorMessage(error, "Nao foi possivel salvar suas preferencias.");
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StateCard
        title="Perfil em preparacao"
        message="Estamos carregando seu historico, badges e preferencias para montar sua visao pessoal."
        variant="loading"
      />
    );
  }

  return (
    <section className="grid">
      <article className="card hero">
        <div className="section-head">
          <div>
            <h2>Perfil e historico de leitura</h2>
            <p>
              Acompanhe seus numeros, sua linha do tempo e as preferencias que influenciam metas, alertas e ranking.
            </p>
          </div>
          <span className="kpi">{auth?.name ?? profile?.name}</span>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{formatInteger(home?.userSummary.totalPagesRead)}</strong>
            <span>paginas lidas</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(home?.userSummary.totalFinished)}</strong>
            <span>livros concluidos</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(home?.readingProgress.streakDays)}</strong>
            <span>dias de streak</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(home?.readingProgress.sessionsThisWeek)}</strong>
            <span>sessoes na semana</span>
          </div>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Ritmo da semana</h3>
          <span className="kpi">Visao resumida</span>
        </div>
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.activeReadings)}</strong>
            <span>leituras ativas</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.pagesThisWeek)}</strong>
            <span>paginas nesta semana</span>
          </div>
          <div className="stat-box">
            <strong>{formatDecimal(profileInsights.averagePagesPerSession)}</strong>
            <span>media por sessao</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(profileInsights.totalBadges)}</strong>
            <span>badges acumuladas</span>
          </div>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Conta</h3>
          <span className="kpi">{profile?.badges.length ?? 0} badge(s)</span>
        </div>
        <div className="stacked-list">
          <div className="stacked-list-item">
            <strong>Nome</strong>
            <span>{profile?.name}</span>
          </div>
          <div className="stacked-list-item">
            <strong>Email</strong>
            <span>{profile?.email}</span>
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
            {saving ? "Salvando..." : "Salvar preferencias"}
          </button>
        </form>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Acoes rapidas</h3>
          <span className="kpi">Atalhos</span>
        </div>
        <div className="quick-links-grid">
          <Link to="/books" className="btn-muted btn-link">
            Explorar catalogo
          </Link>
          <Link to="/goals" className="btn-muted btn-link">
            Revisar metas
          </Link>
          <Link to="/reviews" className="btn-muted btn-link">
            Gerenciar reviews
          </Link>
          <Link to="/leaderboard" className="btn-muted btn-link">
            Abrir ranking
          </Link>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Historico recente</h3>
          <span className="kpi">{filteredTimeline.length} registro(s)</span>
        </div>
        <select aria-label="Filtrar historico de leitura" value={readingFilter} onChange={(event) => setReadingFilter(event.target.value as "ALL" | "IN_PROGRESS" | "FINISHED")}>
          <option value="ALL">Todas as leituras</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="FINISHED">Concluidas</option>
        </select>
        {filteredTimeline.length > 0 ? (
          <ul className="stacked-list">
            {filteredTimeline.map((item) => (
              <li key={item.id} className="stacked-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p className="section-sub">{item.subtitle}</p>
                  <small>{formatDateTimeBr(item.date)}</small>
                </div>
                <Link to={item.link} className="btn-muted btn-link">
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Seu historico aparecera aqui assim que voce registrar leituras.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Badges recentes</h3>
          <span className="kpi">{profileInsights.recentBadges.length} destaque(s)</span>
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
                  Abrir badges
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Seus proximos badges vao aparecer aqui conforme o habito de leitura evoluir.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Reviews recentes</h3>
          <span className="kpi">{filteredReviews.length} review(s)</span>
        </div>
        <select aria-label="Filtrar reviews por nota" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as "ALL" | "HIGH" | "LOW")}>
          <option value="ALL">Todas as reviews</option>
          <option value="HIGH">Notas 4 e 5</option>
          <option value="LOW">Notas 1 a 3</option>
        </select>
        {filteredReviews.length > 0 ? (
          <ul className="stacked-list">
            {filteredReviews.slice(0, 5).map((review) => (
              <li key={review.id} className="stacked-list-item">
                <div>
                  <strong>Nota {review.rating}</strong>
                  <p className="section-sub">{review.comment}</p>
                  <small>{formatDateTimeBr(review.updatedAt)}</small>
                </div>
                <Link to="/reviews" className="btn-muted btn-link">
                  Abrir reviews
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-sub">Nenhuma review encontrada para esse filtro.</p>
        )}
      </article>
    </section>
  );
}
