import { useEffect, useMemo, useState } from "react";
import { BarChart3, Crown, Medal, Settings2, Trophy, UsersRound } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { formatInteger } from "@shared/lib/formatters";
import { pluralizePt } from "@shared/lib/presentation";
import { StateCard } from "@shared/ui/feedback/StateCard";

type LeaderboardMetric = "PAGES" | "BOOKS";

type LeaderboardEntry = {
  userId: string;
  name: string;
  value: number;
  metric: LeaderboardMetric;
};

type UserProfile = {
  leaderboardOptIn: boolean;
};

type HomeResume = {
  readings?: Array<{
    book?: {
      id: string;
    };
  }>;
};

function parseMetric(value: string | null): LeaderboardMetric {
  return value === "BOOKS" ? "BOOKS" : "PAGES";
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 10;
  if (parsed > 50) return 50;
  return parsed;
}

function metricCopy(metric: LeaderboardMetric) {
  if (metric === "BOOKS") {
    return {
      title: "Livros concluídos",
      subtitle: "Classificação semanal dos leitores por livros concluídos.",
      singular: "livro",
      plural: "livros",
    };
  }

  return {
    title: "Páginas lidas",
    subtitle: "Classificação semanal dos leitores por páginas lidas.",
    singular: "página",
    plural: "páginas",
  };
}

function formatMetricValue(value: number, copy: ReturnType<typeof metricCopy>) {
  return pluralizePt(value, copy.singular, copy.plural);
}

export function LeaderboardPage() {
  const headers = useAuthHeaders();
  const [searchParams, setSearchParams] = useSearchParams();
  const metric = useMemo(() => parseMetric(searchParams.get("metric")), [searchParams]);
  const limit = useMemo(() => parseLimit(searchParams.get("limit")), [searchParams]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean | null>(null);
  const [currentReadingBookId, setCurrentReadingBookId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const leaderboardRequest = api.get<LeaderboardEntry[]>(`/api/v1/users/leaderboard?limit=${limit}&metric=${metric}`);
        const profileRequest = headers ? api.get<UserProfile>("/api/v1/users/me", { headers }) : Promise.resolve(null);
        const homeRequest = headers ? api.get<HomeResume>("/api/v1/home/resume", { headers }) : Promise.resolve(null);
        const [leaderboardResponse, profileResponse, homeResponse] = await Promise.all([leaderboardRequest, profileRequest, homeRequest]);
        if (cancelled) return;
        setEntries(leaderboardResponse.data);
        setLeaderboardOptIn(profileResponse?.data.leaderboardOptIn ?? null);
        setCurrentReadingBookId(homeResponse?.data.readings?.[0]?.book?.id ?? "");
        setError("");
      } catch (error) {
        if (cancelled) return;
        setEntries([]);
        setCurrentReadingBookId("");
        setError(extractApiErrorMessage(error, "Não foi possível carregar a classificação."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [headers, limit, metric]);

  const changeMetric = (nextMetric: LeaderboardMetric) => {
    const params = new URLSearchParams(searchParams);
    if (nextMetric === "PAGES") params.delete("metric");
    else params.set("metric", nextMetric);
    setSearchParams(params, { replace: true });
  };

  const changeLimit = (nextLimit: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextLimit === 10) params.delete("limit");
    else params.set("limit", String(nextLimit));
    setSearchParams(params, { replace: true });
  };

  const copy = metricCopy(metric);
  const topEntry = entries[0] ?? null;
  const communityTotal = entries.reduce((total, entry) => total + entry.value, 0);
  const averageValue = entries.length > 0 ? Math.round(communityTotal / entries.length) : 0;
  const podium = entries.slice(0, 3);
  const emptyPodiumSlots = ["Top 1", "Top 2", "Top 3"];
  const continueReadingUrl = currentReadingBookId ? `/books/${currentReadingBookId}/read` : "/books";

  if (loading) {
    return (
      <StateCard
        title="Classificação em atualização"
        message="Estamos montando a classificação dos leitores com base nas leituras mais recentes."
        variant="loading"
      />
    );
  }

  return (
    <section className="aura-page aura-leaderboard-page">
      <div className="card hero aura-hero aura-hero--leaderboard">
        <div>
          <p className="eyebrow aura-eyebrow">Ritmo dos leitores</p>
          <h2>Classificação dos leitores</h2>
          <p>{copy.subtitle}</p>
        </div>
        <div className="aura-hero__signal">
          <Trophy aria-hidden="true" />
          <strong>{entries.length}</strong>
          <span>{entries.length === 1 ? "participante" : "participantes"}</span>
        </div>
      </div>

      <article className="card aura-panel aura-panel--wide">
        <div className="section-head">
          <h3><Settings2 aria-hidden="true" /> Seu status na classificação</h3>
          <span className="kpi">{leaderboardOptIn ? "Participação ativa" : "Participação desligada"}</span>
        </div>
        <p className="section-sub">
          {leaderboardOptIn
            ? "Seu progresso já pode entrar nos destaques da semana."
            : "Ative a participação no seu perfil para aparecer na classificação."}
        </p>
        <div className="card-actions">
          <Link to="/profile?action=preferences" className="btn-link">
            {leaderboardOptIn ? "Abrir perfil" : "Ajustar preferências"}
          </Link>
          <Link to={continueReadingUrl} className="btn-muted btn-link">
            Continuar lendo
          </Link>
        </div>
      </article>

      <article className="card tabs-card aura-panel aura-panel--wide">
        <div className="tabs-row" role="tablist" aria-label="Métricas da classificação">
          <button
            type="button"
            role="tab"
            aria-selected={metric === "PAGES"}
            className={metric === "PAGES" ? "tab active" : "tab"}
            onClick={() => changeMetric("PAGES")}
          >
            Páginas lidas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metric === "BOOKS"}
            className={metric === "BOOKS" ? "tab active" : "tab"}
            onClick={() => changeMetric("BOOKS")}
          >
            Livros concluídos
          </button>
        </div>
        <div className="card-actions" role="group" aria-label="Quantidade de participantes exibidos">
          <button
            type="button"
            className={limit === 10 ? "btn-muted active" : "btn-muted"}
            aria-pressed={limit === 10}
            onClick={() => changeLimit(10)}
          >
            Top 10
          </button>
          <button
            type="button"
            className={limit === 20 ? "btn-muted active" : "btn-muted"}
            aria-pressed={limit === 20}
            onClick={() => changeLimit(20)}
          >
            Top 20
          </button>
          <button
            type="button"
            className={limit === 50 ? "btn-muted active" : "btn-muted"}
            aria-pressed={limit === 50}
            onClick={() => changeLimit(50)}
          >
            Top 50
          </button>
        </div>
      </article>

      {error && <StateCard title="Não foi possível carregar a classificação" message={error} variant="error" />}

      {!error && (
        <div className="stats-grid aura-stats">
          <div className="stat-box">
            <Crown aria-hidden="true" />
            <strong>{topEntry ? topEntry.name : "Aguardando leitores"}</strong>
            <span>líder atual</span>
          </div>
          <div className="stat-box">
            <BarChart3 aria-hidden="true" />
            <strong>{topEntry ? formatMetricValue(topEntry.value, copy) : "0"}</strong>
            <span>melhor marca</span>
          </div>
          <div className="stat-box">
            <UsersRound aria-hidden="true" />
            <strong>{formatInteger(entries.length)}</strong>
            <span>participantes elegíveis</span>
          </div>
          <div className="stat-box">
            <Medal aria-hidden="true" />
            <strong>{formatInteger(communityTotal)}</strong>
            <span>volume total da semana</span>
          </div>
          <div className="stat-box">
            <BarChart3 aria-hidden="true" />
            <strong>{formatInteger(averageValue)}</strong>
            <span>média por participante</span>
          </div>
        </div>
      )}

      {!error && podium.length > 0 && (
        <article className="card aura-panel aura-panel--wide">
          <div className="section-head">
            <h3><Trophy aria-hidden="true" /> Pódio da semana</h3>
            <span className="kpi">{copy.title}</span>
          </div>
          <div className="grid aura-podium-grid">
            {podium.map((entry, index) => {
              const gapToLeader = topEntry ? Math.max(0, topEntry.value - entry.value) : 0;

              return (
                <article key={entry.userId} className="card aura-podium-card">
                <p className="eyebrow">Posição {index + 1}</p>
                <h3>{entry.name}</h3>
                <p className="section-sub">{copy.title}</p>
                <strong>
                  {formatMetricValue(entry.value, copy)}
                </strong>
                <div className="leaderboard-share" aria-label={`Participação de ${entry.name}`}>
                  <span style={{ width: `${communityTotal > 0 ? Math.round((entry.value / communityTotal) * 100) : 0}%` }} />
                </div>
                <small>
                  {communityTotal > 0 ? Math.round((entry.value / communityTotal) * 100) : 0}% do volume
                </small>
                  <span className={gapToLeader === 0 ? "favorite-badge" : "import-badge"}>
                    {gapToLeader === 0 ? "Líder" : `Faltam ${formatMetricValue(gapToLeader, copy)}`}
                  </span>
                </article>
              );
            })}
          </div>
        </article>
      )}

      {!error && podium.length === 0 && (
        <article className="card aura-panel aura-panel--wide leaderboard-empty-podium">
          <div className="section-head">
            <h3><Trophy aria-hidden="true" /> Pódio aguardando leitores</h3>
            <span className="kpi">{copy.title}</span>
          </div>
          <div className="grid aura-podium-grid">
            {emptyPodiumSlots.map((slot) => (
              <article key={slot} className="card aura-podium-card aura-podium-card--empty">
                <p className="eyebrow">{slot}</p>
                <h3>Posição disponível</h3>
                <p className="section-sub">
                  Leia, salve seu progresso e volte para disputar esta posição.
                </p>
                <span className="import-badge">Aguardando participação</span>
              </article>
            ))}
          </div>
          <div className="card-actions leaderboard-empty-actions">
            <Link to={continueReadingUrl} className="btn-link">
              Começar leitura
            </Link>
            <Link to="/profile?action=preferences" className="btn-muted btn-link">
              Ajustar preferências
            </Link>
          </div>
        </article>
      )}

      <div className="grid aura-leaderboard-grid">
        {entries.slice(3).map((entry, index) => {
          const gapToLeader = topEntry ? Math.max(0, topEntry.value - entry.value) : 0;
          const share = communityTotal > 0 ? Math.round((entry.value / communityTotal) * 100) : 0;

          return (
            <article key={entry.userId} className="card aura-leaderboard-card">
              <p className="eyebrow">#{index + 4}</p>
              <h3>{entry.name}</h3>
              <p className="section-sub">{copy.title}</p>
              <strong>
                {formatMetricValue(entry.value, copy)}
              </strong>
              <div className="leaderboard-share" aria-label={`Participação de ${entry.name}`}>
                <span style={{ width: `${share}%` }} />
              </div>
              <small>{share}% do volume</small>
              <span className={gapToLeader === 0 ? "favorite-badge" : "import-badge"}>
                {gapToLeader === 0 ? "Líder" : `Faltam ${formatMetricValue(gapToLeader, copy)}`}
              </span>
            </article>
          );
        })}
      </div>

      {!loading && !error && entries.length === 0 && (
        <StateCard
          title="Ainda não há leitores classificados nesta semana."
          message="A classificação desta semana ainda está começando. Continue lendo para aparecer entre os primeiros colocados."
          action={
            <Link to={continueReadingUrl} className="btn-link">
              Começar leitura
            </Link>
          }
        />
      )}
    </section>
  );
}
