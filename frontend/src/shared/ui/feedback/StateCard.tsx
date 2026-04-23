import type { ReactNode } from "react";

type StateCardProps = {
  title: string;
  message: string;
  variant?: "loading" | "empty" | "error";
  action?: ReactNode;
};

export function StateCard({ title, message, variant = "empty", action }: StateCardProps) {
  const role = variant === "error" ? "alert" : "status";
  const live = variant === "error" ? "assertive" : "polite";

  return (
    <article className={`card state-card state-card--${variant}`} role={role} aria-live={live}>
      <p className="eyebrow">{variant === "loading" ? "Carregando" : variant === "error" ? "Atencao" : "Sem dados"}</p>
      <h3>{title}</h3>
      <p className="section-sub">{message}</p>
      {action ? <div className="card-actions">{action}</div> : null}
    </article>
  );
}
