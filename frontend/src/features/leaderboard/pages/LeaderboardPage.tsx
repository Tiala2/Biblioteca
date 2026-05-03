import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { formatInteger } from "@shared/lib/formatters";
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
      title: "Livros concluidos",
      subtitle: "Ranking semanal por livros finalizados com opt-in ativo.",
      valueLabel: "livro(s)",
    };
  }

  return {
    title: "Paginas lidas",
    subtitle: "Ranking semanal da comunidade por paginas lidas com opt-in ativo.",
    valueLabel: "pagina(s)",
  };
}

export function LeaderboardPage() {
  const headers = useAuthHeaders();
  const [searchParams, setSearchParams] = useSearchParams();
  const metric = useMemo(() => parseMetric(searchParams.get("metric")), [searchParams]);
  const limit = useMemo(() => parseLimit(searchParams.get("limit")), [searchParams]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const leaderboardRequest = api.get<LeaderboardEntry[]>(`/api/v1/users/leaderboard?limit=${limit}&metric=${metric}`);
        const profileRequest = headers ? api.get<UserProfile>("/api/v1/users/me", { headers }) : Promise.resolve(null);
        const [leaderboardResponse, profileResponse] = await Promise.all([leaderboardRequest, profileRequest]);
        if (cancelled) return;
        setEntries(leaderboardResponse.data);
        setLeaderboardOptIn(profileResponse?.data.leaderboardOptIn ?? null);
        setError("");
      } catch (error) {
        if (cancelled) return;
        setEntries([]);
        setError(extractApiErrorMessage(error, "Nao foi possivel carregar o ranking."));
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
  const podium = entries.slice(0, 3);

  if (loading) {
    return (
      <StateCard
        title="Ranking em atualizacao"
        message="Estamos montando a classificacao da comunidade com base nas leituras mais recentes."
        variant="loading"
      />
    );
  }

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Ranking semanal da comunidade</h2>
          <p className="section-sub">{copy.subtitle}</p>
        </div>
        <span className="kpi">{entries.length} participante(s)</span>
      </div>

      <article className="card">
        <div className="section-head">
          <h3>Seu status no ranking</h3>
          <span className="kpi">{leaderboardOptIn ? "Opt-in ativo" : "Opt-in desligado"}</span>
        </div>
        <p className="section-sub">
          {leaderboardOptIn
            ? "Seu progresso ja pode entrar no ranking semanal."
            : "Ative a participacao no seu perfil para aparecer no ranking."}
        </p>
        <div className="card-actions">
          <Link to="/profile" className="btn-link">
            Ajustar preferencias
          </Link>
        </div>
      </article>

      <article className="card tabs-card">
        <div className="tabs-row" role="tablist" aria-label="Metricas do ranking">
          <button
            type="button"
            role="tab"
            aria-selected={metric === "PAGES"}
            className={metric === "PAGES" ? "tab active" : "tab"}
            onClick={() => changeMetric("PAGES")}
          >
            Paginas lidas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metric === "BOOKS"}
            className={metric === "BOOKS" ? "tab active" : "tab"}
            onClick={() => changeMetric("BOOKS")}
          >
            Livros concluidos
          </button>
        </div>
        <div className="card-actions">
          <button type="button" className={limit === 10 ? "btn-muted active" : "btn-muted"} onClick={() => changeLimit(10)}>
            Top 10
          </button>
          <button type="button" className={limit === 20 ? "btn-muted active" : "btn-muted"} onClick={() => changeLimit(20)}>
            Top 20
          </button>
          <button type="button" className={limit === 50 ? "btn-muted active" : "btn-muted"} onClick={() => changeLimit(50)}>
            Top 50
          </button>
        </div>
      </article>

      {error && <StateCard title="Falha ao carregar ranking" message={error} variant="error" />}

      {!error && (
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{topEntry ? topEntry.name : "Sem lider"}</strong>
            <span>lider atual</span>
          </div>
          <div className="stat-box">
            <strong>{topEntry ? `${formatInteger(topEntry.value)} ${copy.valueLabel}` : "0"}</strong>
            <span>melhor marca</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(entries.length)}</strong>
            <span>participantes elegiveis</span>
          </div>
          <div className="stat-box">
            <strong>{formatInteger(communityTotal)}</strong>
            <span>volume total da semana</span>
          </div>
        </div>
      )}

      {!error && podium.length > 0 && (
        <article className="card">
          <div className="section-head">
            <h3>Podio da semana</h3>
            <span className="kpi">{copy.title}</span>
          </div>
          <div className="grid">
            {podium.map((entry, index) => (
              <article key={entry.userId} className="card">
                <p className="eyebrow">Posicao {index + 1}</p>
                <h3>{entry.name}</h3>
                <p className="section-sub">{copy.title}</p>
                <strong>
                  {formatInteger(entry.value)} {copy.valueLabel}
                </strong>
              </article>
            ))}
          </div>
        </article>
      )}

      <div className="grid">
        {entries.map((entry, index) => (
          <article key={entry.userId} className="card">
            <p className="eyebrow">#{index + 1}</p>
            <h3>{entry.name}</h3>
            <p className="section-sub">{copy.title}</p>
            <strong>
              {formatInteger(entry.value)} {copy.valueLabel}
            </strong>
          </article>
        ))}
      </div>

      {!loading && !error && entries.length === 0 && (
        <StateCard
          title="Nenhum participante elegivel nesta semana"
          message="Ative seu opt-in no perfil e continue lendo para aparecer na proxima atualizacao do ranking."
          action={
            <Link to="/profile" className="btn-link">
              Ajustar preferencias
            </Link>
          }
        />
      )}
    </section>
  );
}
