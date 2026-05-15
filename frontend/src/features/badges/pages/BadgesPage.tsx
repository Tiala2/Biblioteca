import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Medal, Sparkles, Trophy } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { pluralizePt } from "@shared/lib/presentation";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  awardedAt: string;
};

type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

type HomeResponse = {
  userSummary: {
    totalFinished: number;
    totalPagesRead: number;
  };
  readingProgress: {
    streakDays: number;
  };
};

type ProgressCard = {
  code: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function BadgesPage() {
  const headers = useAuthHeaders();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progressCards, setProgressCards] = useState<ProgressCard[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const size = 8;
  const progressInsights = useMemo(() => {
    const decorated = progressCards.map((card) => {
      const percent = Math.max(0, Math.min(100, Math.round((card.current / card.target) * 100)));
      return {
        ...card,
        missing: Math.max(0, card.target - card.current),
        percent,
      };
    });
    const nextUnlock = decorated
      .filter((card) => card.missing > 0)
      .sort((left, right) => right.percent - left.percent)[0] ?? null;

    return {
      completed: decorated.filter((card) => card.missing === 0).length,
      nextUnlock,
    };
  }, [progressCards]);

  useEffect(() => {
    if (!headers) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [badgeResponse, homeResponse] = await Promise.all([
          api.get<Page<Badge>>(`/api/v1/users/me/badges?page=${page}&size=${size}`, { headers }),
          api.get<HomeResponse>("/api/v1/home/resume", { headers }),
        ]);

        if (!active) return;

        setBadges(badgeResponse.data.content);
        setTotalPages(badgeResponse.data.page.totalPages);

        const stats = homeResponse.data;
        setProgressCards([
          {
            code: "FIRST_BOOK_FINISHED",
            name: "Primeiro livro concluído",
            current: Math.min(stats.userSummary.totalFinished, 1),
            target: 1,
            unit: "livro",
          },
          {
            code: "STREAK_7_DAYS",
            name: "Streak de 7 dias",
            current: Math.min(stats.readingProgress.streakDays, 7),
            target: 7,
            unit: "dias",
          },
          {
            code: "STREAK_30_DAYS",
            name: "Streak de 30 dias",
            current: Math.min(stats.readingProgress.streakDays, 30),
            target: 30,
            unit: "dias",
          },
          {
            code: "TOTAL_BOOKS_10",
            name: "Meta de 10 livros",
            current: Math.min(stats.userSummary.totalFinished, 10),
            target: 10,
            unit: "livros",
          },
          {
            code: "TOTAL_PAGES_1000",
            name: "Mil páginas lidas",
            current: Math.min(stats.userSummary.totalPagesRead, 1000),
            target: 1000,
            unit: "páginas",
          },
        ]);

        setError("");
      } catch (error) {
        if (!active) return;
        setError(extractApiErrorMessage(error, "Não foi possível carregar conquistas."));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [headers, page]);

  const goToPage = (nextPage: number) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 0) params.delete("page");
    else params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  };

  return (
    <section className="aura-page">
      <div className="card hero aura-hero aura-hero--badges">
        <div>
          <p className="eyebrow aura-eyebrow">Coleção de momentos</p>
          <h2>Conquistas da sua jornada</h2>
          <p>Cada conquista marca um hábito que ganhou forma. Continue lendo para desbloquear novos sinais da sua evolução.</p>
        </div>
        <div className="aura-hero__signal">
          <Trophy aria-hidden="true" />
          <strong>{badges.length}</strong>
          <span>na página</span>
        </div>
      </div>

      {loading && (
        <StateCard
          title="Conquistas em carregamento"
          message="Estamos atualizando suas conquistas e o progresso das próximas trilhas."
          variant="loading"
        />
      )}
      {!loading && error && <StateCard title="Falha ao carregar conquistas" message={error} variant="error" />}

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <h3><Sparkles aria-hidden="true" /> Progresso das próximas conquistas</h3>
          <span className="kpi">{pluralizePt(progressCards.length, "trilha", "trilhas")}</span>
        </div>
        <div className="badge-insights">
          <div className="stat-box">
            <CheckCircle2 aria-hidden="true" />
            <strong>{progressInsights.completed}</strong>
            <span>{progressInsights.completed === 1 ? "trilha completa" : "trilhas completas"}</span>
          </div>
          <div className="stat-box badge-insights__next">
            <Sparkles aria-hidden="true" />
            <strong>{progressInsights.nextUnlock?.name ?? "Tudo em dia"}</strong>
            <span>
              {progressInsights.nextUnlock
                ? `Faltam ${progressInsights.nextUnlock.missing} ${progressInsights.nextUnlock.unit}`
                : "Nenhuma pendência nas trilhas atuais"}
            </span>
          </div>
        </div>
        <div className="grid">
          {progressCards.map((card) => {
            const percent = Math.max(0, Math.min(100, Math.round((card.current / card.target) * 100)));
            const missing = Math.max(0, card.target - card.current);
            return (
              <article key={card.code} className="card aura-badge-progress-card">
                <h3>{card.name}</h3>
                <p className="section-sub">
                  {card.current} de {card.target} {card.unit}
                </p>
                <div className="progress-track aura-progress" aria-hidden="true">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
                <small>{percent}% concluído</small>
                <span className={missing === 0 ? "favorite-badge" : "import-badge"}>
                  {missing === 0 ? "Concluída" : `Faltam ${missing} ${card.unit}`}
                </span>
              </article>
            );
          })}
        </div>
      </article>

      <div className="grid aura-badge-grid">
        {badges.map((badge) => (
          <article key={badge.id} className="card aura-badge-card">
            <Medal aria-hidden="true" />
            <h3>{badge.name}</h3>
            <p>{badge.description}</p>
            <small>Código: {badge.code}</small>
            <br />
            <small>Conquistado em: {new Date(badge.awardedAt).toLocaleString()}</small>
          </article>
        ))}
      </div>

      <div className="pagination-row">
        <button
          type="button"
          className="btn-muted"
          aria-label="Ir para a página anterior de conquistas"
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
          aria-label="Ir para a próxima página de conquistas"
          disabled={loading || page + 1 >= Math.max(totalPages, 1)}
          onClick={() => goToPage(page + 1)}
        >
          Próxima
        </button>
      </div>

      {!loading && !error && badges.length === 0 && (
        <StateCard
          title="Nenhuma conquista desbloqueada ainda"
          message="Continue lendo, salvando progresso e concluindo metas para liberar suas primeiras conquistas."
          action={
            <Link to="/books" className="btn-link">
              Continuar lendo
            </Link>
          }
        />
      )}
    </section>
  );
}
