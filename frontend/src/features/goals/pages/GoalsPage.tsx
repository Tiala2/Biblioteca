import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CalendarClock, Flame, Gauge, Target } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { StateCard } from "@shared/ui/feedback/StateCard";
import { formatReadingStatus, pluralizePt } from "@shared/lib/presentation";

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

const ALERT_TYPE_LABELS: Record<string, string> = {
  GOAL_EXPIRING: "Meta perto do prazo",
  PACE_WARNING: "Ritmo em atenção",
  NO_STREAK: "Sequência pausada",
  PACE: "Ritmo de leitura",
};

const ALERT_SEVERITY_LABELS: Record<string, string> = {
  INFO: "Informativo",
  LOW: "Baixa prioridade",
  WARNING: "Atenção",
  HIGH: "Alta prioridade",
  ERROR: "Crítico",
  CRITICAL: "Crítico",
};

function humanizeCode(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function formatAlertType(type: string) {
  return ALERT_TYPE_LABELS[type] ?? humanizeCode(type);
}

function formatAlertSeverity(severity: string) {
  return ALERT_SEVERITY_LABELS[severity] ?? humanizeCode(severity);
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
      setError(extractApiErrorMessage(error, "Não foi possível carregar metas e alertas."));
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
      const message = extractApiErrorMessage(error, "Não foi possível salvar a meta.");
      setError(message);
      showToast(message, "error");
    }
  };

  const progressPercent = Math.max(0, Math.min(100, Number(goal?.progressPercent ?? 0)));
  const suggestedDailyPages = goal && goal.expiresInDays > 0 ? Math.ceil(goal.remainingPages / goal.expiresInDays) : goal?.remainingPages ?? 0;
  const paceLabel = goal?.paceWarning ? "Ajuste necessário" : "Bom ritmo";
  const goalInsights = useMemo(() => {
    const highPriorityAlerts = alerts.filter((alert) => ["HIGH", "ERROR", "CRITICAL", "WARNING"].includes(alert.severity)).length;
    const nextMilestone = goal ? Math.min(goal.targetPages, Math.ceil(goal.progressPages / 25) * 25 + 25) : 0;
    const pagesToMilestone = goal ? Math.max(0, nextMilestone - goal.progressPages) : 0;

    return {
      highPriorityAlerts,
      pagesToMilestone,
    };
  }, [alerts, goal]);

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
    <section className="grid aura-page">
      <article className="card hero aura-hero aura-hero--goals">
        <div className="aura-hero__content">
          <div>
            <p className="eyebrow aura-eyebrow">Ritual de leitura</p>
            <h2>Transforme leitura em constância</h2>
            <p>Defina uma meta que parece possível hoje e acompanhe o ritmo sem pressão.</p>
          </div>
          <div className="aura-hero__signal">
            <Flame aria-hidden="true" />
            <strong>{streak}</strong>
            <span>{streak === 1 ? "dia consecutivo" : "dias consecutivos"}</span>
          </div>
        </div>
      </article>

      <article className="card aura-panel">
        <div className="section-head">
          <h3><Target aria-hidden="true" /> Configurar meta</h3>
          <span className="kpi">{period === "WEEKLY" ? "Semanal" : "Mensal"}</span>
        </div>
        <form id="goal-form" onSubmit={onSubmit}>
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

      <article className="card aura-panel aura-panel--focus">
        <div className="section-head">
          <h3><Gauge aria-hidden="true" /> Resumo</h3>
          <span className="kpi">{goal ? `${goal.progressPages}/${goal.targetPages} págs` : "Sem meta ativa"}</span>
        </div>
        {goal ? (
          <>
            <div className="goal-summary-grid">
              <div className="stat-box">
                <strong>{Math.round(progressPercent)}%</strong>
                <span>progresso</span>
              </div>
              <div className="stat-box">
                <strong>{goal.remainingPages}</strong>
                <span>páginas restantes</span>
              </div>
              <div className="stat-box">
                <strong>{goal.expiresInDays}</strong>
                <span>dias restantes</span>
              </div>
              <div className="stat-box">
                <strong>{suggestedDailyPages}</strong>
                <span>páginas por dia</span>
              </div>
              <div className="stat-box">
                <strong>{alerts.length}</strong>
                <span>alertas ativos</span>
              </div>
              <div className="stat-box">
                <strong>{streak}</strong>
                <span>dias de sequência</span>
              </div>
            </div>
            <div className="goal-status-row">
              <span className={goal.paceWarning ? "import-badge" : "favorite-badge"}>{paceLabel}</span>
              <span className={goalInsights.highPriorityAlerts > 0 ? "import-badge" : "favorite-badge"}>
                {goalInsights.highPriorityAlerts > 0
                  ? `${pluralizePt(goalInsights.highPriorityAlerts, "alerta prioritário", "alertas prioritários")}`
                  : "Sem alerta prioritário"}
              </span>
              <span className="section-sub">Status: {formatReadingStatus(goal.status)}</span>
            </div>
            <p>Leitura acumulada: {goal.progressPages} páginas de {goal.targetPages} planejadas.</p>
            <div className="goal-plan-note">
              <CalendarClock aria-hidden="true" />
              <div>
                <strong>
                  {goalInsights.pagesToMilestone > 0
                    ? `Faltam ${goalInsights.pagesToMilestone} páginas para o próximo marco`
                    : "Marco atual alcançado"}
                </strong>
                <small>
                  {goal.expiresInDays > 0
                    ? `${pluralizePt(goal.expiresInDays, "dia restante", "dias restantes")} neste período`
                    : "Período encerrando, revise sua próxima meta"}
                </small>
              </div>
            </div>
            <div className="progress-track aura-progress" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        ) : (
          <>
            <p className="section-sub">
              Você ainda não tem meta ativa para este período. Defina uma quantidade de páginas e salve para acompanhar
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

      <article className="card aura-panel">
        <div className="section-head">
          <h3><BellRing aria-hidden="true" /> Alertas</h3>
          <span className="kpi">{pluralizePt(alerts.length, "aviso", "avisos")}</span>
        </div>
        {alerts.length === 0 && (
          <p className="section-sub">
            Sem alertas no momento. Quando a meta precisar de ajuste, os avisos vão aparecer aqui.
          </p>
        )}
        {alerts.length > 0 && (
          <ul className="stacked-list">
            {alerts.map((alert) => (
              <li key={alert.id} className="stacked-list-item">
                <div>
                  <div className="goal-alert-title">
                    <strong>{formatAlertSeverity(alert.severity)}</strong>
                    <span className="import-badge">{formatAlertType(alert.type)}</span>
                  </div>
                  <p className="section-sub">{alert.message}</p>
                </div>
                {alert.suggestedDailyPages ? (
                  <span className="kpi">{alert.suggestedDailyPages} págs/dia</span>
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
