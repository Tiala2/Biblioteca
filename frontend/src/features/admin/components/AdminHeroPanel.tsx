import { BookOpen, Heart, LibraryBig, MessageSquareText, Tags, UsersRound } from "lucide-react";
import type { Metrics } from "../types";

type AdminHeroPanelProps = {
  metrics: Metrics | null;
  error: string;
};

export function AdminHeroPanel({ metrics, error }: AdminHeroPanelProps) {
  return (
    <article id="admin-metrics" className="card hero aura-hero admin-hero">
      <div className="aura-hero__content">
        <div>
          <p className="eyebrow aura-eyebrow">Central de operação</p>
          <h2>Painel admin</h2>
          <p>Controle acervo, engajamento, usuários e auditoria com visão rápida do estado da plataforma.</p>
        </div>
        <div className="aura-hero__signal">
          <LibraryBig aria-hidden="true" />
          <strong>Admin</strong>
          <span>operação</span>
        </div>
      </div>
      {metrics ? (
        <div className="stats-grid aura-stats admin-hero__stats">
          <div className="stat-box">
            <UsersRound aria-hidden="true" />
            <strong>{metrics.totalUsers}</strong>
            <span>usuários</span>
          </div>
          <div className="stat-box">
            <BookOpen aria-hidden="true" />
            <strong>{metrics.totalBooks}</strong>
            <span>livros</span>
          </div>
          <div className="stat-box">
            <MessageSquareText aria-hidden="true" />
            <strong>{metrics.totalReviews}</strong>
            <span>avaliações</span>
          </div>
          <div className="stat-box">
            <Heart aria-hidden="true" />
            <strong>{metrics.totalFavorites}</strong>
            <span>favoritos</span>
          </div>
          <div className="stat-box">
            <LibraryBig aria-hidden="true" />
            <strong>{metrics.totalCollections}</strong>
            <span>coleções</span>
          </div>
          <div className="stat-box">
            <Tags aria-hidden="true" />
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
