import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BookCover } from "@shared/ui/books/BookCover";
import type { Book, BookForm, Category, ImportResult } from "../types";
import { AdminEmptyState } from "./AdminEmptyState";

function normalizeIsbn(isbn?: string | null) {
  const normalized = isbn?.replace(/[^0-9Xx]/g, "");
  return normalized ? normalized.toUpperCase() : "";
}

function buildOpenLibraryCoverUrl(isbn?: string | null) {
  const cleanIsbn = normalizeIsbn(isbn);
  return cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false` : "";
}

type BookPanelProps = {
  form: BookForm;
  books: Book[];
  categories: Category[];
  busyKey: string | null;
  uploadBookId: string;
  uploadFile: File | null;
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
  uploadFile,
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
  const pageSize = 4;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBooks = useMemo(() => {
    if (!normalizedSearch) return books;
    return books.filter((book) =>
      `${book.title} ${book.author ?? ""} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [books, normalizedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const visibleBooks = filteredBooks.slice(page * pageSize, page * pageSize + pageSize);
  const selectedCoverBook = books.find((book) => book.id === coverBookId) ?? null;
  const formCoverUrlFromIsbn = buildOpenLibraryCoverUrl(form.isbn);
  const selectedCoverUrlFromIsbn = buildOpenLibraryCoverUrl(selectedCoverBook?.isbn);
  const toggleCategory = (categoryId: string) => {
    onFormChange((prev) => {
      const selected = new Set(prev.categoryIds);
      if (selected.has(categoryId)) {
        selected.delete(categoryId);
      } else {
        selected.add(categoryId);
      }
      return { ...prev, categoryIds: Array.from(selected) };
    });
  };

  return (
    <article id="admin-books" className="card admin-panel admin-panel--wide">
      <h3>{form.id ? "Editar livro" : "Novo livro"}</h3>
      <form className="admin-form" onSubmit={onSubmitBook}>
        <input aria-label="Título do livro" value={form.title} onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))} placeholder="Título" required />
        <input aria-label="Autor do livro" value={form.author} onChange={(event) => onFormChange((prev) => ({ ...prev, author: event.target.value }))} placeholder="Autor" required />
        <input aria-label="ISBN do livro" value={form.isbn} onChange={(event) => onFormChange((prev) => ({ ...prev, isbn: event.target.value }))} placeholder="ISBN" required />
        <input
          aria-label="Número de páginas"
          type="number"
          min={1}
          value={form.numberOfPages}
          onChange={(event) => onFormChange((prev) => ({ ...prev, numberOfPages: Number(event.target.value) }))}
        />
        <input
          aria-label="Data de publicação"
          type="date"
          value={form.publicationDate}
          onChange={(event) => onFormChange((prev) => ({ ...prev, publicationDate: event.target.value }))}
        />
        <input aria-label="URL da capa" value={form.coverUrl} onChange={(event) => onFormChange((prev) => ({ ...prev, coverUrl: event.target.value }))} placeholder="URL da capa" />
        <button
          type="button"
          className="btn-muted"
          disabled={!formCoverUrlFromIsbn}
          onClick={() => onFormChange((prev) => ({ ...prev, coverUrl: buildOpenLibraryCoverUrl(prev.isbn) }))}
        >
          Buscar capa por ISBN
        </button>
        <fieldset className="admin-choice-list">
          <legend>Categorias do livro</legend>
          {categories.length > 0 ? (
            <div className="admin-choice-list__items">
              {categories.map((category) => (
                <label key={category.id} className="admin-choice-option">
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="section-sub">Cadastre categorias para classificar o livro.</p>
          )}
        </fieldset>
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
        <select aria-label="Livro para atualizar capa" value={coverBookId} onChange={(event) => onCoverBookChange(event.target.value)}>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <input aria-label="Nova URL da capa" value={coverBookUrl} onChange={(event) => onCoverUrlChange(event.target.value)} placeholder="Nova capa" />
        <button type="button" className="btn-muted" disabled={!selectedCoverUrlFromIsbn} onClick={() => onCoverUrlChange(selectedCoverUrlFromIsbn)}>
          Usar ISBN do livro
        </button>
        <button type="submit" disabled={busyKey === "book-cover"}>
          Atualizar capa
        </button>
      </form>

      <form className="admin-form" onSubmit={onSubmitUpload}>
        <select aria-label="Livro para enviar PDF" value={uploadBookId} onChange={(event) => onUploadBookChange(event.target.value)}>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <label className="file-picker">
          <span>Selecionar PDF</span>
          <strong>{uploadFile?.name ?? "Nenhum arquivo selecionado"}</strong>
          <input className="sr-only" aria-label="Arquivo PDF do livro" type="file" accept="application/pdf" onChange={(event) => onUploadFileChange(event.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" disabled={busyKey === "book-upload"}>
          Enviar PDF
        </button>
      </form>

      <form className="admin-form" onSubmit={onSubmitImport}>
        <input aria-label="Busca na Open Library" value={importQuery} onChange={(event) => onImportQueryChange(event.target.value)} placeholder="Busca Open Library" />
        <input aria-label="Quantidade de páginas para importar" type="number" min={1} value={importPages} onChange={(event) => onImportPagesChange(Number(event.target.value))} />
        <input aria-label="Tamanho da página de importação" type="number" min={1} value={importPageSize} onChange={(event) => onImportPageSizeChange(Number(event.target.value))} />
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
            <div className="book-list-row">
              <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
              <div>
                <strong>{book.title}</strong>
              <p className="section-sub">
                {book.author ?? "Autor não informado"} - {book.isbn}
                </p>
              </div>
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
      {filteredBooks.length === 0 && <AdminEmptyState title="Nenhum livro encontrado" message="Revise o termo de busca, autor ou ISBN para localizar outro item do acervo." />}
      {filteredBooks.length > pageSize && (
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
