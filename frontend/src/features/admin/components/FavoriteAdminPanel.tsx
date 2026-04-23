import { useMemo, useState } from "react";
import { formatDateTimeBr } from "@shared/lib/formatters";
import type { FavoriteAdmin } from "../types";

type FavoriteAdminPanelProps = {
  favorites: FavoriteAdmin[];
};

export function FavoriteAdminPanel({ favorites }: FavoriteAdminPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredFavorites = useMemo(() => {
    if (!normalizedSearch) return favorites;
    return favorites.filter((favorite) =>
      `${favorite.bookTitle} ${favorite.bookIsbn ?? ""} ${favorite.source ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [favorites, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredFavorites.length / pageSize));
  const visibleFavorites = filteredFavorites.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-favorites" className="card admin-panel">
      <div className="section-head">
        <h3>Favoritos registrados</h3>
        <span className="kpi">{filteredFavorites.length}</span>
      </div>
      <p className="section-sub">
        Visao consolidada dos livros mais salvos na plataforma.
      </p>
      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Filtrar favoritos por titulo, ISBN ou origem"
      />
      <ul className="stacked-list">
        {visibleFavorites.map((favorite) => (
          <li key={`${favorite.bookId}-${favorite.createdAt ?? "sem-data"}`} className="stacked-list-item">
            <div>
              <strong>{favorite.bookTitle}</strong>
              <p className="section-sub">{favorite.bookIsbn || "ISBN nao informado"}</p>
              <p className="section-sub">Origem {favorite.source ?? "desconhecida"} | Favoritado em {formatDateTimeBr(favorite.createdAt)}</p>
            </div>
            <span className="import-badge">{favorite.source ?? "LOCAL"}</span>
          </li>
        ))}
      </ul>
      {filteredFavorites.length === 0 && <p className="section-sub">Nenhum favorito encontrado para esse filtro.</p>}
      {filteredFavorites.length > pageSize && (
        <div className="pagination-row">
          <button type="button" className="btn-muted" disabled={page <= 0} onClick={() => setPage((previous) => Math.max(0, previous - 1))}>
            Anterior
          </button>
          <span className="section-sub">Pagina {page + 1} de {totalPages}</span>
          <button type="button" className="btn-muted" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}>
            Proxima
          </button>
        </div>
      )}
    </article>
  );
}
