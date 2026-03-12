import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";

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

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function BadgesPage() {
  const { auth } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const size = 8;

  useEffect(() => {
    if (!auth) return;
    api
      .get<Page<Badge>>(`/api/v1/users/me/badges?page=${page}&size=${size}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      .then((response) => {
        setBadges(response.data.content);
        setTotalPages(response.data.page.totalPages);
      })
      .catch(() => setError("Nao foi possivel carregar badges."))
      .finally(() => setLoading(false));
  }, [auth, page]);

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

      <div className="grid">
        {badges.map((badge) => (
          <article key={badge.id} className="card">
            <h3>{badge.name}</h3>
            <p>{badge.description}</p>
            <small>Código: {badge.code}</small>
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
          Página {page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          className="btn-muted"
          disabled={loading || page + 1 >= Math.max(totalPages, 1)}
          onClick={() => goToPage(page + 1)}
        >
          Próxima
        </button>
      </div>

      {!loading && badges.length === 0 && <p className="section-sub">Nenhum badge conquistado ainda.</p>}
    </section>
  );
}

