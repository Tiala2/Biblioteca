import { useMemo, useState } from "react";
import { formatDateTimeBr } from "@shared/lib/formatters";
import { BookCover } from "@shared/ui/books/BookCover";
import type { FavoriteAdmin } from "../types";
import { formatFavoriteSource } from "../lib/labels";
import { AdminEmptyState } from "./AdminEmptyState";

type FavoriteAdminPanelProps = {
  favorites: FavoriteAdmin[];
};

export function FavoriteAdminPanel({ favorites }: FavoriteAdminPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredFavorites = useMemo(() => {
    if (!normalizedSearch) return favorites;
    return favorites.filter((favorite) =>
      `${favorite.bookTitle} ${favorite.bookIsbn ?? ""} ${favorite.source ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [favorites, normalizedSearch]);
  const favoriteInsights = useMemo(() => {
    const openCount = favorites.filter((favorite) => favorite.source === "OPEN").length;
    const localCount = favorites.length - openCount;
    const latest = favorites.reduce<FavoriteAdmin | null>((current, favorite) => {
      if (!favorite.createdAt) return current;
      if (!current?.createdAt) return favorite;
      return new Date(favorite.createdAt).getTime() > new Date(current.createdAt).getTime() ? favorite : current;
    }, null);

    return { latest, localCount, openCount };
  }, [favorites]);
  const totalPages = Math.max(1, Math.ceil(filteredFavorites.length / pageSize));
  const visibleFavorites = filteredFavorites.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-favorites" className="card admin-panel">
      <div className="section-head">
        <h3>Favoritos registrados</h3>
        <span className="kpi">{filteredFavorites.length}</span>
      </div>
      <p className="section-sub">
        Visão consolidada dos livros mais salvos na plataforma.
      </p>
      <div className="admin-favorite-summary">
        <div className="stat-box admin-list-stat">
          <strong>{favoriteInsights.localCount}</strong>
          <span>locais/PDF</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{favoriteInsights.openCount}</strong>
          <span>Open Library</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{favoriteInsights.latest ? formatDateTimeBr(favoriteInsights.latest.createdAt) : "-"}</strong>
          <span>último favorito</span>
        </div>
      </div>
      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Filtrar favoritos por título, ISBN ou origem"
      />
      <ul className="stacked-list">
        {visibleFavorites.map((favorite) => (
          <li key={`${favorite.bookId}-${favorite.createdAt ?? "sem-data"}`} className="stacked-list-item">
            <div className="book-list-row">
              <BookCover title={favorite.bookTitle} coverUrl={favorite.coverUrl} isbn={favorite.bookIsbn} size="small" />
              <div>
                <strong>{favorite.bookTitle}</strong>
                <p className="section-sub">{favorite.bookIsbn || "ISBN não informado"}</p>
                <p className="section-sub">
                  Origem {formatFavoriteSource(favorite.source)}. Favoritado em {formatDateTimeBr(favorite.createdAt)}.
                </p>
              </div>
            </div>
            <span className="import-badge">{formatFavoriteSource(favorite.source)}</span>
          </li>
        ))}
      </ul>
      {filteredFavorites.length === 0 && <AdminEmptyState title="Nenhum favorito encontrado" message="Revise o filtro para conferir outros livros salvos pelos usuários." />}
      {filteredFavorites.length > pageSize && (
        <div className="pagination-row">
          <button type="button" className="btn-muted" disabled={page <= 0} onClick={() => setPage((previous) => Math.max(0, previous - 1))}>
            Anterior
          </button>
          <span className="section-sub">Página {page + 1} de {totalPages}</span>
          <button type="button" className="btn-muted" disabled={page + 1 >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}>
            Próxima
          </button>
        </div>
      )}
    </article>
  );
}
