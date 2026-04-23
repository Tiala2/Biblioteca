import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";

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
            name: "Primeiro livro concluido",
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
            name: "Mil paginas lidas",
            current: Math.min(stats.userSummary.totalPagesRead, 1000),
            target: 1000,
            unit: "paginas",
          },
        ]);

        setError("");
      } catch {
        if (!active) return;
        setError("Nao foi possivel carregar badges.");
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
    <section>
      <div className="section-head">
        <div>
          <h2>Conquistas da sua jornada</h2>
          <p className="section-sub">Colecione badges e acompanhe marcos da leitura.</p>
        </div>
        <span className="kpi">{badges.length} na pagina</span>
      </div>

      {loading && <p className="section-sub">Carregando badges...</p>}
      {error && <p className="error">{error}</p>}

      <article className="card">
        <div className="section-head">
          <h3>Progresso das proximas conquistas</h3>
          <span className="kpi">{progressCards.length} trilha(s)</span>
        </div>
        <div className="grid">
          {progressCards.map((card) => {
            const percent = Math.max(0, Math.min(100, Math.round((card.current / card.target) * 100)));
            return (
              <article key={card.code} className="card">
                <h3>{card.name}</h3>
                <p className="section-sub">
                  {card.current} de {card.target} {card.unit}
                </p>
                <div className="progress-track" aria-hidden="true">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
                <small>{percent}% concluido</small>
              </article>
            );
          })}
        </div>
      </article>

      <div className="grid">
        {badges.map((badge) => (
          <article key={badge.id} className="card">
            <h3>{badge.name}</h3>
            <p>{badge.description}</p>
            <small>Codigo: {badge.code}</small>
            <br />
            <small>Conquistado em: {new Date(badge.awardedAt).toLocaleString()}</small>
          </article>
        ))}
      </div>

      <div className="pagination-row">
        <button className="btn-muted" disabled={page <= 0 || loading} onClick={() => goToPage(page - 1)}>
          Anterior
        </button>
        <span className="section-sub">
          Pagina {page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          className="btn-muted"
          disabled={loading || page + 1 >= Math.max(totalPages, 1)}
          onClick={() => goToPage(page + 1)}
        >
          Proxima
        </button>
      </div>

      {!loading && badges.length === 0 && <p className="section-sub">Nenhum badge conquistado ainda.</p>}
    </section>
  );
}
