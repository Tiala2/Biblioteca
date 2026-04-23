import type { Metrics } from "../types";

type AdminHeroPanelProps = {
  metrics: Metrics | null;
  error: string;
};

export function AdminHeroPanel({ metrics, error }: AdminHeroPanelProps) {
  return (
    <article id="admin-metrics" className="card hero admin-hero">
      <div className="section-head">
        <h2>Painel admin</h2>
        <span className="kpi">ADMIN</span>
      </div>
      {metrics ? (
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{metrics.totalUsers}</strong>
            <span>usuarios</span>
          </div>
          <div className="stat-box">
            <strong>{metrics.totalBooks}</strong>
            <span>livros</span>
          </div>
          <div className="stat-box">
            <strong>{metrics.totalReviews}</strong>
            <span>reviews</span>
          </div>
          <div className="stat-box">
            <strong>{metrics.totalFavorites}</strong>
            <span>favoritos</span>
          </div>
          <div className="stat-box">
            <strong>{metrics.totalCollections}</strong>
            <span>colecoes</span>
          </div>
          <div className="stat-box">
            <strong>{metrics.totalTags}</strong>
            <span>tags</span>
          </div>
        </div>
      ) : (
        <p className="section-sub">Carregando indicadores...</p>
      )}
      {error && <p className="error">{error}</p>}
    </article>
  );
}
