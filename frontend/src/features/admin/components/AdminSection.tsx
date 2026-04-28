import type { ReactNode } from "react";

type AdminSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  variant?: "compact" | "wide";
};

export function AdminSection({ eyebrow, title, description, children, variant = "compact" }: AdminSectionProps) {
  return (
    <section className={`admin-section admin-section--${variant}`}>
      <div className="admin-section__head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-sub">{description}</p>
      </div>
      <div className="admin-section__grid">{children}</div>
    </section>
  );
}
