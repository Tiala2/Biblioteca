import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";

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

export function GoalsPage() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [targetPages, setTargetPages] = useState(120);
  const [goal, setGoal] = useState<GoalResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const period = useMemo(() => parsePeriod(searchParams.get("period")), [searchParams]);
  const headers = auth ? { Authorization: `Bearer ${auth.token}` } : undefined;

  const loadAll = async (selectedPeriod: Period) => {
    if (!headers) return;
    try {
      const [goalRes, alertsRes, streakRes] = await Promise.all([
        api.get<GoalResponse>(`/api/v1/users/me/goals?period=${selectedPeriod}`, { headers }),
        api.get<AlertResponse[]>(`/api/v1/users/me/alerts?period=${selectedPeriod}`, { headers }),
        api.get<StreakResponse>("/api/v1/users/me/streak", { headers }),
      ]);
      setGoal(goalRes.data);
      setTargetPages(goalRes.data.targetPages);
      setAlerts(alertsRes.data);
      setStreak(streakRes.data.streakDays);
      setError("");
    } catch {
      setError("Nao foi possivel carregar metas e alertas.");
    }
  };

  useEffect(() => {
    void loadAll(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, auth?.token]);

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
      await api.put(
        "/api/v1/users/me/goals",
        { period, targetPages: Number(targetPages) },
        { headers }
      );
      await loadAll(period);
      showToast("Meta atualizada com sucesso.", "success");
    } catch {
      setError("Falha ao atualizar meta.");
      showToast("Nao foi possivel salvar a meta.", "error");
    }
  };

  return (
    <section className="grid">
      <article className="card hero">
        <h2>Transforme leitura em constancia</h2>
        <p>Defina, acompanhe e conclua metas sem pressão de competição.</p>
        <p className="quote">Streak atual: {streak} dia(s) consecutivos</p>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Configurar meta</h3>
        </div>
        <form onSubmit={onSubmit}>
          <label>Período</label>
          <select value={period} onChange={(event) => onPeriodChange(event.target.value as Period)}>
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensal</option>
          </select>

          <label>Páginas alvo</label>
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
          <span className="kpi">{goal ? `${goal.progressPages}/${goal.targetPages} págs` : "Sem meta ativa"}</span>
        </div>
        {goal ? (
          <>
            <p>Status: {goal.status}</p>
            <p>Jornada atual: {goal.progressPages} páginas lidas de {goal.targetPages} planejadas.</p>
            <p>Restante: {goal.remainingPages} páginas</p>
            <p>Expira em: {goal.expiresInDays} dia(s)</p>
            <p>Ritmo: {goal.paceWarning ? "Ajuste necessário" : "Bom ritmo"}</p>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, Number(goal.progressPercent)))}%` }} />
            </div>
          </>
        ) : (
          <p className="section-sub">Sem meta ativa.</p>
        )}
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Alertas</h3>
        </div>
        {alerts.length === 0 && <p className="section-sub">Sem alertas no momento.</p>}
        <ul>
          {alerts.map((alert) => (
            <li key={alert.id}>
              [{alert.severity}] {alert.message}
              {alert.suggestedDailyPages ? ` (${alert.suggestedDailyPages} págs/dia)` : ""}
            </li>
          ))}
        </ul>
      </article>

      {error && <article className="card error">{error}</article>}
    </section>
  );
}

