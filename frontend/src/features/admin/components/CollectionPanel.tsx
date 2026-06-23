import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BookCover } from "@shared/ui/books/BookCover";
import { formatBookSource, formatReadingMode, pluralizePt } from "@shared/lib/presentation";
import type { Book, Collection, CollectionForm } from "../types";
import { focusAdminPanelForm } from "../lib/focus";
import { AdminEmptyState } from "./AdminEmptyState";

type CollectionPanelProps = {
  form: CollectionForm;
  collections: Collection[];
  books: Book[];
  busyKey: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: CollectionForm) => CollectionForm) => void;
  onEdit: (collection: Collection) => void;
  onEditBook: (book: Book) => void;
  onReset: () => void;
  onDelete: (collectionId: string) => void;
};

function CollectionBookMeta({ book }: { book: Book }) {
  return (
    <span className="admin-book-badges" aria-label={`Origem e leitura de ${book.title}`}>
      <span className="import-badge">{formatBookSource(book.source)}</span>
      <span className={book.hasPdf ? "favorite-badge" : "import-badge"}>
        {formatReadingMode(book.hasPdf, book.source)}
      </span>
    </span>
  );
}

const FRIENDLY_ADMIN_COLLECTION_NAMES = [
  "Fantasia épica",
  "Distopias essenciais",
  "Clássicos para começar",
  "Leituras curtas",
  "Jornadas marcantes",
  "Favoritos da comunidade",
];

function getAdminCollectionTitle(collection: Collection, index: number) {
  const title = collection.title?.trim();
  const looksTechnical =
    !title ||
    /route|post|debug|teste|test/i.test(title) ||
    /^[a-z]+[-_][a-z0-9-_]+$/i.test(title);

  return looksTechnical ? FRIENDLY_ADMIN_COLLECTION_NAMES[index % FRIENDLY_ADMIN_COLLECTION_NAMES.length] : title;
}

export function CollectionPanel({
  form,
  collections,
  books,
  busyKey,
  onSubmit,
  onFormChange,
  onEdit,
  onEditBook,
  onReset,
  onDelete,
}: CollectionPanelProps) {
  const [search, setSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedBookSearch = bookSearch.trim().toLowerCase();
  const filteredCollections = useMemo(() => {
    if (!normalizedSearch) return collections;
    return collections.filter((collection) =>
      `${collection.title} ${collection.description ?? ""} ${(collection.books ?? []).map((book) => book.title).join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [collections, normalizedSearch]);
  const bookOptions = useMemo(() => {
    if (!normalizedBookSearch) return books;
    return books.filter((book) =>
      `${book.title} ${book.author ?? ""} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedBookSearch)
    );
  }, [books, normalizedBookSearch]);
  const selectedBooks = books.filter((book) => form.bookIds.includes(book.id));
  const visibleBookOptions = bookOptions.slice(0, 80);
  const collectionInsights = useMemo(() => {
    const linkedBooks = collections.reduce((total, collection) => total + (collection.books?.length ?? 0), 0);
    const largestIndex = collections.reduce((currentIndex, collection, index) => {
      if (currentIndex < 0) return index;
      return (collection.books?.length ?? 0) > (collections[currentIndex].books?.length ?? 0) ? index : currentIndex;
    }, -1);
    const largestTitle =
      largestIndex >= 0 ? getAdminCollectionTitle(collections[largestIndex], largestIndex) : "-";

    return { largestTitle, linkedBooks };
  }, [collections]);
  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / pageSize));
  const visibleCollections = filteredCollections.slice(page * pageSize, page * pageSize + pageSize);
  const saving = busyKey === "collection-create" || busyKey === `collection-save-${form.id}`;
  const editCollection = (collection: Collection) => {
    onEdit(collection);
    focusAdminPanelForm("admin-collections");
  };
  const editLinkedBook = (book: Book) => {
    onEditBook(book);
    focusAdminPanelForm("admin-books");
  };
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
            <>
              <input
                aria-label="Buscar livros para coleção"
                value={bookSearch}
                onChange={(event) => setBookSearch(event.target.value)}
                placeholder="Buscar por título, autor ou ISBN"
              />
              {selectedBooks.length > 0 && (
                <p className="section-sub">
                  {pluralizePt(selectedBooks.length, "livro selecionado", "livros selecionados")}: {selectedBooks.slice(0, 3).map((book) => book.title).join(", ")}
                  {selectedBooks.length > 3 ? "..." : ""}
                </p>
              )}
              <div className="admin-choice-list__items">
                {visibleBookOptions.map((book) => (
                  <div key={book.id} className="admin-choice-option admin-choice-option--book">
                    <label className="admin-book-choice-label">
                      <input type="checkbox" checked={form.bookIds.includes(book.id)} onChange={() => toggleBook(book.id)} />
                      <span>
                        <strong>{book.title}</strong>
                        <small>{book.author ?? "Autoria ainda não informada"} · {book.isbn ?? "sem ISBN"}</small>
                        <CollectionBookMeta book={book} />
                      </span>
                    </label>
                    <button type="button" className="btn-muted admin-inline-action" onClick={() => editLinkedBook(book)}>
                      Editar livro
                    </button>
                  </div>
                ))}
              </div>
              {bookOptions.length === 0 && <p className="section-sub">Nenhum livro encontrado para esse termo.</p>}
              {bookOptions.length > visibleBookOptions.length && (
                <small className="section-sub">Mostrando os primeiros 80 resultados. Refine a busca para selecionar mais rápido.</small>
              )}
            </>
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
          <strong>{collectionInsights.largestTitle}</strong>
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
        {visibleCollections.map((collection) => {
          const collectionTitle = getAdminCollectionTitle(collection, filteredCollections.indexOf(collection));
          return (
          <li key={collection.id} className="stacked-list-item">
            <button type="button" className="book-list-row book-list-row--action" onClick={() => editCollection(collection)}>
              <BookCover
                title={collectionTitle}
                coverUrl={collection.coverUrl ?? collection.books?.[0]?.coverUrl}
                isbn={collection.books?.[0]?.isbn}
                size="small"
              />
              <div>
                <strong>{collectionTitle}</strong>
                <p className="section-sub">{pluralizePt(collection.books?.length ?? 0, "livro", "livros")}</p>
                {collection.description && <p className="section-sub">{collection.description}</p>}
                {(collection.books?.length ?? 0) > 0 && (
                  <small>{collection.books?.slice(0, 2).map((book) => book.title).join(", ")}</small>
                )}
              </div>
            </button>
            <div className="card-actions admin-list-actions">
              <button type="button" className="btn-muted" onClick={() => editCollection(collection)}>
                Editar
              </button>
              <button
                type="button"
                className="btn-muted btn-danger"
                disabled={busyKey === `collection-delete-${collection.id}`}
                onClick={() => onDelete(collection.id)}
              >
                {busyKey === `collection-delete-${collection.id}` ? "Removendo..." : "Remover"}
              </button>
            </div>
          </li>
          );
        })}
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
