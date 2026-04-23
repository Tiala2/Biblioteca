import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Book, Collection, CollectionForm } from "../types";

function readSelectedValues(event: ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.currentTarget.selectedOptions, (option) => option.value);
}

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
  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / pageSize));
  const visibleCollections = filteredCollections.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-collections" className="card admin-panel">
      <h3>{form.id ? "Editar colecao" : "Nova colecao"}</h3>
      <form className="admin-form" onSubmit={onSubmit}>
        <input value={form.title} onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo" required />
        <input
          value={form.description}
          onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Descricao"
        />
        <input value={form.coverUrl} onChange={(event) => onFormChange((prev) => ({ ...prev, coverUrl: event.target.value }))} placeholder="URL da capa" />
        <select multiple size={5} value={form.bookIds} onChange={(event) => onFormChange((prev) => ({ ...prev, bookIds: readSelectedValues(event) }))}>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busyKey === "collection-create" || busyKey === `collection-save-${form.id}`}>
          {form.id ? "Salvar colecao" : "Criar colecao"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>
      <div className="section-head">
        <h4>Lista de colecoes</h4>
        <span className="kpi">{filteredCollections.length}</span>
      </div>
      <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Filtrar colecoes" />
      <ul className="stacked-list">
        {visibleCollections.map((collection) => (
          <li key={collection.id} className="stacked-list-item">
            <div>
              <strong>{collection.title}</strong>
              <p className="section-sub">{collection.books?.length ?? 0} livro(s)</p>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(collection)}>
                Editar
              </button>
              <button
                type="button"
                className="btn-muted"
                disabled={busyKey === `collection-delete-${collection.id}`}
                onClick={() => onDelete(collection.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredCollections.length === 0 && <p className="section-sub">Nenhuma colecao encontrada para esse filtro.</p>}
      {filteredCollections.length > pageSize && (
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
