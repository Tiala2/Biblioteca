import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BookCover } from "@shared/ui/books/BookCover";
import { pluralizePt } from "@shared/lib/presentation";
import type { Book, Collection, CollectionForm } from "../types";
import { AdminEmptyState } from "./AdminEmptyState";

type CollectionPanelProps = {
  form: CollectionForm;
  collections: Collection[];
  books: Book[];
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: CollectionForm) => CollectionForm) => void;
  onEdit: (collection: Collection) => void;
  onReset: () => void;
  onDelete: (collectionId: string) => void;
};

export function CollectionPanel({
  form,
  collections,
  books,
  busyKey,
  onSubmit,
  onFormChange,
  onEdit,
  onReset,
  onDelete,
}: CollectionPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCollections = useMemo(() => {
    if (!normalizedSearch) return collections;
    return collections.filter((collection) =>
      `${collection.title} ${collection.description ?? ""} ${(collection.books ?? []).map((book) => book.title).join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [collections, normalizedSearch]);
  const collectionInsights = useMemo(() => {
    const linkedBooks = collections.reduce((total, collection) => total + (collection.books?.length ?? 0), 0);
    const largest = collections.reduce<Collection | null>((current, collection) => {
      if (!current) return collection;
      return (collection.books?.length ?? 0) > (current.books?.length ?? 0) ? collection : current;
    }, null);

    return { largest, linkedBooks };
  }, [collections]);
  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / pageSize));
  const visibleCollections = filteredCollections.slice(page * pageSize, page * pageSize + pageSize);
  const saving = busyKey === "collection-create" || busyKey === `collection-save-${form.id}`;
  const toggleBook = (bookId: string) => {
    onFormChange((prev) => {
      const selected = new Set(prev.bookIds);
      if (selected.has(bookId)) {
        selected.delete(bookId);
      } else {
        selected.add(bookId);
      }
      return { ...prev, bookIds: Array.from(selected) };
    });
  };

  return (
    <article id="admin-collections" className="card admin-panel">
      <h3>{form.id ? "Editar coleção" : "Nova coleção"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <input
          aria-label="Título da coleção"
          value={form.title}
          onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Título"
          required
        />
        <input
          aria-label="Descrição da coleção"
          value={form.description}
          onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Descrição"
        />
        <input
          aria-label="URL da capa da coleção"
          value={form.coverUrl}
          onChange={(event) => onFormChange((prev) => ({ ...prev, coverUrl: event.target.value }))}
          placeholder="URL da capa"
        />
        <fieldset className="admin-choice-list">
          <legend>Livros da coleção</legend>
          {books.length > 0 ? (
            <div className="admin-choice-list__items">
              {books.map((book) => (
                <label key={book.id} className="admin-choice-option">
                  <input type="checkbox" checked={form.bookIds.includes(book.id)} onChange={() => toggleBook(book.id)} />
                  <span>{book.title}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="section-sub">Cadastre livros para montar coleções.</p>
          )}
        </fieldset>
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : form.id ? "Salvar coleção" : "Criar coleção"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Lista de coleções</h4>
        <span className="kpi">{filteredCollections.length}</span>
      </div>
      <div className="admin-collection-summary">
        <div className="stat-box admin-list-stat">
          <strong>{collections.length}</strong>
          <span>coleções criadas</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{collectionInsights.linkedBooks}</strong>
          <span>livros vinculados</span>
        </div>
        <div className="stat-box admin-list-stat">
          <strong>{collectionInsights.largest?.title ?? "-"}</strong>
          <span>maior coleção</span>
        </div>
      </div>
      <input
        aria-label="Filtrar coleções"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Filtrar coleções"
      />
      <ul className="stacked-list">
        {visibleCollections.map((collection) => (
          <li key={collection.id} className="stacked-list-item">
            <div className="book-list-row">
              <BookCover
                title={collection.title}
                coverUrl={collection.coverUrl ?? collection.books?.[0]?.coverUrl}
                isbn={collection.books?.[0]?.isbn}
                size="small"
              />
              <div>
                <strong>{collection.title}</strong>
                <p className="section-sub">{pluralizePt(collection.books?.length ?? 0, "livro", "livros")}</p>
                {collection.description && <p className="section-sub">{collection.description}</p>}
                {(collection.books?.length ?? 0) > 0 && (
                  <small>{collection.books?.slice(0, 2).map((book) => book.title).join(", ")}</small>
                )}
              </div>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(collection)}>
                Editar
              </button>
              <button
                type="button"
                className="btn-muted btn-danger"
                disabled={busyKey === `collection-delete-${collection.id}`}
                onClick={() => onDelete(collection.id)}
              >
                {busyKey === `collection-delete-${collection.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredCollections.length === 0 && <AdminEmptyState title="Nenhuma coleção encontrada" message="Revise o filtro ou crie uma coleção para destacar grupos de livros." />}
      {filteredCollections.length > pageSize && (
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
