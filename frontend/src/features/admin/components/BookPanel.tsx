import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Book, BookForm, Category, ImportResult } from "../types";

function readSelectedValues(event: ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.currentTarget.selectedOptions, (option) => option.value);
}

type BookPanelProps = {
  form: BookForm;
  books: Book[];
  categories: Category[];
  busyKey: string | null;
  uploadBookId: string;
  coverBookId: string;
  coverBookUrl: string;
  importQuery: string;
  importPages: number;
  importPageSize: number;
  importResult: ImportResult | null;
  onSubmitBook: (event: FormEvent) => Promise<void>;
  onSubmitUpload: (event: FormEvent) => Promise<void>;
  onSubmitCover: (event: FormEvent) => Promise<void>;
  onSubmitImport: (event: FormEvent) => Promise<void>;
  onFormChange: (updater: (previous: BookForm) => BookForm) => void;
  onReset: () => void;
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onUploadBookChange: (value: string) => void;
  onCoverBookChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
  onUploadFileChange: (file: File | null) => void;
  onImportQueryChange: (value: string) => void;
  onImportPagesChange: (value: number) => void;
  onImportPageSizeChange: (value: number) => void;
};

export function BookPanel({
  form,
  books,
  categories,
  busyKey,
  uploadBookId,
  coverBookId,
  coverBookUrl,
  importQuery,
  importPages,
  importPageSize,
  importResult,
  onSubmitBook,
  onSubmitUpload,
  onSubmitCover,
  onSubmitImport,
  onFormChange,
  onReset,
  onEdit,
  onDelete,
  onUploadBookChange,
  onCoverBookChange,
  onCoverUrlChange,
  onUploadFileChange,
  onImportQueryChange,
  onImportPagesChange,
  onImportPageSizeChange,
}: BookPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBooks = useMemo(() => {
    if (!normalizedSearch) return books;
    return books.filter((book) =>
      `${book.title} ${book.author ?? ""} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [books, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const visibleBooks = filteredBooks.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <article id="admin-books" className="card admin-panel admin-panel--wide">
      <h3>{form.id ? "Editar livro" : "Novo livro"}</h3>
      <form className="admin-form" onSubmit={onSubmitBook}>
        <input value={form.title} onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo" required />
        <input value={form.author} onChange={(event) => onFormChange((prev) => ({ ...prev, author: event.target.value }))} placeholder="Autor" required />
        <input value={form.isbn} onChange={(event) => onFormChange((prev) => ({ ...prev, isbn: event.target.value }))} placeholder="ISBN" required />
        <input
          type="number"
          min={1}
          value={form.numberOfPages}
          onChange={(event) => onFormChange((prev) => ({ ...prev, numberOfPages: Number(event.target.value) }))}
        />
        <input
          type="date"
          value={form.publicationDate}
          onChange={(event) => onFormChange((prev) => ({ ...prev, publicationDate: event.target.value }))}
        />
        <input value={form.coverUrl} onChange={(event) => onFormChange((prev) => ({ ...prev, coverUrl: event.target.value }))} placeholder="URL da capa" />
        <select multiple size={5} value={form.categoryIds} onChange={(event) => onFormChange((prev) => ({ ...prev, categoryIds: readSelectedValues(event) }))}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busyKey === "book-create" || busyKey === `book-save-${form.id}`}>
          {form.id ? "Salvar livro" : "Criar livro"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            Cancelar
          </button>
        )}
      </form>

      <form className="admin-form" onSubmit={onSubmitCover}>
        <select value={coverBookId} onChange={(event) => onCoverBookChange(event.target.value)}>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <input value={coverBookUrl} onChange={(event) => onCoverUrlChange(event.target.value)} placeholder="Nova capa" />
        <button type="submit" disabled={busyKey === "book-cover"}>
          Atualizar capa
        </button>
      </form>

      <form className="admin-form" onSubmit={onSubmitUpload}>
        <select value={uploadBookId} onChange={(event) => onUploadBookChange(event.target.value)}>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <input type="file" accept="application/pdf" onChange={(event) => onUploadFileChange(event.target.files?.[0] ?? null)} />
        <button type="submit" disabled={busyKey === "book-upload"}>
          Enviar PDF
        </button>
      </form>

      <form className="admin-form" onSubmit={onSubmitImport}>
        <input value={importQuery} onChange={(event) => onImportQueryChange(event.target.value)} placeholder="Busca Open Library" />
        <input type="number" min={1} value={importPages} onChange={(event) => onImportPagesChange(Number(event.target.value))} />
        <input type="number" min={1} value={importPageSize} onChange={(event) => onImportPageSizeChange(Number(event.target.value))} />
        <button type="submit" disabled={busyKey === "book-import"}>
          Importar
        </button>
      </form>

      {importResult && (
        <p className="section-sub">
          Importados: {importResult.imported} | Pulados: {importResult.skipped} | Falhas: {importResult.failed}
        </p>
      )}

      <div className="section-head">
        <h4>Lista de livros</h4>
        <span className="kpi">{filteredBooks.length}</span>
      </div>
      <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Filtrar por titulo, autor ou ISBN" />
      <ul className="stacked-list">
        {visibleBooks.map((book) => (
          <li key={book.id} className="stacked-list-item">
            <div>
              <strong>{book.title}</strong>
              <p className="section-sub">
                {book.author ?? "Autor nao informado"} - {book.isbn}
              </p>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(book)}>
                Editar
              </button>
              <button type="button" className="btn-muted" disabled={busyKey === `book-delete-${book.id}`} onClick={() => onDelete(book.id)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
      {filteredBooks.length === 0 && <p className="section-sub">Nenhum livro encontrado para esse filtro.</p>}
      {filteredBooks.length > pageSize && (
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
