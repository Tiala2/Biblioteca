import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";

type Period = "WEEKLY" | "MONTHLY";

type GoalResponse = {
  period: Period;
  targetPages: number;
  progressPages: number;
  progressPercent: number;
  remainingPages: number;
  expiresInDays: number;
  paceWarning: boolean;
  status: string;
};

type AlertResponse = {
  id: string;
  type: string;
  severity: string;
  message: string;
  suggestedDailyPages?: number;
};

type StreakResponse = { streakDays: number };

function parsePeriod(value: string | null): Period {
  return value === "WEEKLY" ? "WEEKLY" : "MONTHLY";
}

function normalizeGoal(value: GoalResponse | "" | null | undefined): GoalResponse | null {
  if (!value || typeof value !== "object") return null;
  return value;
}

export function GoalsPage() {
  const headers = useAuthHeaders();
  const { showToast } = useToast();
  const [targetPages, setTargetPages] = useState(120);
  const [goal, setGoal] = useState<GoalResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const period = useMemo(() => parsePeriod(searchParams.get("period")), [searchParams]);

  const loadAll = useCallback(async (selectedPeriod: Period) => {
    if (!headers) return;
    try {
      setLoading(true);
      const [goalRes, alertsRes, streakRes] = await Promise.all([
        api.get<GoalResponse | "">(`/api/v1/users/me/goals?period=${selectedPeriod}`, { headers }),
        api.get<AlertResponse[]>(`/api/v1/users/me/alerts?period=${selectedPeriod}`, { headers }),
        api.get<StreakResponse>("/api/v1/users/me/streak", { headers }),
      ]);

      const nextGoal = normalizeGoal(goalRes.data);
      setGoal(nextGoal);
      if (nextGoal) {
        setTargetPages(nextGoal.targetPages);
      }

      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
      setStreak(streakRes.data?.streakDays ?? 0);
      setError("");
    } catch (error) {
      setError(extractApiErrorMessage(error, "Nao foi possivel carregar metas e alertas."));
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    void loadAll(period);
  }, [loadAll, period]);

  const onPeriodChange = (nextPeriod: Period) => {
    const params = new URLSearchParams(searchParams);
    if (nextPeriod === "MONTHLY") {
      params.delete("period");
    } else {
      params.set("period", nextPeriod);
    }
    setSearchParams(params, { replace: true });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    try {
      const response = await api.put<GoalResponse>("/api/v1/users/me/goals", { period, targetPages: Number(targetPages) }, { headers });
      const nextGoal = normalizeGoal(response.data);
      setGoal(nextGoal);
      if (nextGoal) {
        setTargetPages(nextGoal.targetPages);
      }

      const [alertsResult, streakResult] = await Promise.allSettled([
        api.get<AlertResponse[]>(`/api/v1/users/me/alerts?period=${period}`, { headers }),
        api.get<StreakResponse>("/api/v1/users/me/streak", { headers }),
      ]);

      if (alertsResult.status === "fulfilled") {
        setAlerts(Array.isArray(alertsResult.value.data) ? alertsResult.value.data : []);
      }

      if (streakResult.status === "fulfilled") {
        setStreak(streakResult.value.data?.streakDays ?? 0);
      }

      setError("");
      showToast("Meta atualizada com sucesso.", "success");
    } catch (error) {
      const message = extractApiErrorMessage(error, "Nao foi possivel salvar a meta.");
      setError(message);
      showToast(message, "error");
    }
  };

  const progressPercent = Math.max(0, Math.min(100, Number(goal?.progressPercent ?? 0)));

  if (loading) {
    return (
      <StateCard
        title="Metas em carregamento"
        message="Estamos atualizando seu resumo, alertas e o ritmo atual da leitura."
        variant="loading"
      />
    );
  }

  return (
    <section className="grid">
      <article className="card hero">
        <h2>Transforme leitura em constancia</h2>
        <p>Defina, acompanhe e conclua metas com um painel simples e claro.</p>
        <p className="quote">Streak atual: {streak} dia(s) consecutivos</p>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Configurar meta</h3>
          <span className="kpi">{period === "WEEKLY" ? "Semanal" : "Mensal"}</span>
        </div>
        <form id="goal-form" onSubmit={onSubmit}>
          <label>Periodo</label>
          <select value={period} onChange={(event) => onPeriodChange(event.target.value as Period)}>
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensal</option>
          </select>

          <label>Paginas alvo</label>
          <input
            type="number"
            min={1}
            value={targetPages}
            onChange={(event) => setTargetPages(Number(event.target.value))}
          />
          <button type="submit">Salvar meta</button>
        </form>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Resumo</h3>
          <span className="kpi">{goal ? `${goal.progressPages}/${goal.targetPages} pags` : "Sem meta ativa"}</span>
        </div>
        {goal ? (
          <>
            <p>Status: {goal.status}</p>
            <p>Leitura acumulada: {goal.progressPages} paginas de {goal.targetPages} planejadas.</p>
            <p>Restante: {goal.remainingPages} paginas</p>
            <p>Expira em: {goal.expiresInDays} dia(s)</p>
            <p>Ritmo: {goal.paceWarning ? "Ajuste necessario" : "Bom ritmo"}</p>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        ) : (
          <>
            <p className="section-sub">
              Voce ainda nao tem meta ativa para este periodo. Defina uma quantidade de paginas e salve para acompanhar
              ritmo, alertas e progresso.
            </p>
            <div className="card-actions">
              <Link to="/books" className="btn-muted btn-link">
                Escolher livro
              </Link>
              <button type="submit" form="goal-form">
                Criar meta
              </button>
            </div>
          </>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Alertas</h3>
          <span className="kpi">{alerts.length} aviso(s)</span>
        </div>
        {alerts.length === 0 && (
          <p className="section-sub">
            Sem alertas no momento. Quando a meta precisar de ajuste, os avisos vao aparecer aqui.
          </p>
        )}
        {alerts.length > 0 && (
          <ul className="stacked-list">
            {alerts.map((alert) => (
              <li key={alert.id} className="stacked-list-item">
                <div>
                  <strong>{alert.severity}</strong>
                  <p className="section-sub">{alert.message}</p>
                </div>
                {alert.suggestedDailyPages ? (
                  <span className="kpi">{alert.suggestedDailyPages} pags/dia</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>
      {error && <StateCard title="Falha ao carregar metas" message={error} variant="error" />}
    </section>
  );
}
