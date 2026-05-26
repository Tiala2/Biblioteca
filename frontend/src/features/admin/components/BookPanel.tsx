import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BookPlus, Edit3, ImagePlus, LibraryBig, RotateCcw, Save, Search, Trash2, Upload } from "lucide-react";
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

function getImportStatus(result: ImportResult | null) {
  if (!result) {
    return null;
  }
  if (result.imported > 0 && result.failed > 0) {
    return {
      tone: "warning",
      title: "Importação parcial",
      description: "Alguns livros entraram no catálogo, mas a Open Library falhou em parte da busca. Você pode tentar novamente sem perder o que já foi importado.",
    };
  }
  if (result.imported > 0) {
    return {
      tone: "success",
      title: "Importação concluída",
      description: "Os livros encontrados foram adicionados ou atualizados no acervo.",
    };
  }
  if (result.failed > 0) {
    return {
      tone: "danger",
      title: "Importação não concluída",
      description: "A Open Library não respondeu como esperado. Aguarde alguns instantes e tente novamente.",
    };
  }
  return {
    tone: "muted",
    title: "Nenhum livro novo",
    description: "A busca terminou, mas não encontrou itens elegíveis para adicionar ao acervo.",
  };
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
  importReadableOnly: boolean;
  importTargetCount: number;
  importResult: ImportResult | null;
  onSubmitBook: (event: FormEvent) => Promise<void>;
  onSubmitUpload: (event: FormEvent) => Promise<void>;
  onSubmitCover: (event: FormEvent) => Promise<void>;
  onSubmitImport: (event: FormEvent) => Promise<void>;
  onSubmitGutenbergImport: () => Promise<void>;
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
  onImportReadableOnlyChange: (value: boolean) => void;
  onImportTargetCountChange: (value: number) => void;
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
  importReadableOnly,
  importTargetCount,
  importResult,
  onSubmitBook,
  onSubmitUpload,
  onSubmitCover,
  onSubmitImport,
  onSubmitGutenbergImport,
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
  onImportReadableOnlyChange,
  onImportTargetCountChange,
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
  const selectedUploadBook = books.find((book) => book.id === uploadBookId) ?? null;
  const formCoverUrlFromIsbn = buildOpenLibraryCoverUrl(form.isbn);
  const selectedCoverUrlFromIsbn = buildOpenLibraryCoverUrl(selectedCoverBook?.isbn);
  const importStatus = getImportStatus(importResult);
  const importMessages = importResult?.messages?.filter(Boolean).slice(0, 4) ?? [];
  const hasBooks = books.length > 0;
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
        <div className="admin-form-title">
          <BookPlus aria-hidden="true" />
          <div>
            <strong>Dados principais</strong>
            <span>Título, autoria, ISBN, páginas e classificação.</span>
          </div>
        </div>
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
          <Search aria-hidden="true" />
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
          <Save aria-hidden="true" />
          {busyKey === "book-create" || busyKey === `book-save-${form.id}`
            ? "Salvando..."
            : form.id
              ? "Salvar livro"
              : "Criar livro"}
        </button>
        {form.id && (
          <button type="button" className="btn-muted" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            Cancelar
          </button>
        )}
      </form>

      <form className="admin-form admin-form--compact" onSubmit={onSubmitCover}>
        <div className="admin-form-title">
          <ImagePlus aria-hidden="true" />
          <div>
            <strong>Capa do livro</strong>
            <span>Atualize a imagem manualmente ou a partir do ISBN.</span>
          </div>
        </div>
        <label className="field-stack">
          <span>Livro da capa</span>
          <select aria-label="Livro para atualizar capa" value={coverBookId} disabled={!hasBooks} onChange={(event) => onCoverBookChange(event.target.value)}>
            {!hasBooks && <option value="">Nenhum livro cadastrado</option>}
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>URL da nova capa</span>
          <input aria-label="Nova URL da capa" value={coverBookUrl} onChange={(event) => onCoverUrlChange(event.target.value)} placeholder="Cole a URL da imagem" />
        </label>
        <button type="button" className="btn-muted" disabled={!selectedCoverUrlFromIsbn} onClick={() => onCoverUrlChange(selectedCoverUrlFromIsbn)}>
          <Search aria-hidden="true" />
          Usar ISBN do livro
        </button>
        <button type="submit" disabled={!hasBooks || busyKey === "book-cover"}>
          <Save aria-hidden="true" />
          {busyKey === "book-cover" ? "Atualizando..." : "Atualizar capa"}
        </button>
      </form>

      <form className="admin-form admin-form--compact" onSubmit={onSubmitUpload}>
        <div className="admin-form-title">
          <Upload aria-hidden="true" />
          <div>
            <strong>Arquivo de leitura</strong>
            <span>Envie o PDF para liberar leitura interna no app.</span>
          </div>
        </div>
        <label className="field-stack">
          <span>Livro para arquivo de leitura</span>
          <select aria-label="Livro para enviar arquivo PDF" value={uploadBookId} disabled={!hasBooks} onChange={(event) => onUploadBookChange(event.target.value)}>
            {!hasBooks && <option value="">Nenhum livro cadastrado</option>}
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>
        <label className="file-picker">
          <span>Selecionar arquivo PDF</span>
          <strong>{uploadFile?.name ?? "Nenhum arquivo selecionado"}</strong>
          <input className="sr-only" aria-label="Arquivo PDF do livro" type="file" accept="application/pdf" onChange={(event) => onUploadFileChange(event.target.files?.[0] ?? null)} />
        </label>
        {selectedUploadBook && (
          <p className="section-sub admin-selected-book">
            Arquivo selecionado para <strong>{selectedUploadBook.title}</strong>.
          </p>
        )}
        <button type="submit" disabled={!hasBooks || !uploadFile || busyKey === "book-upload"}>
          <Upload aria-hidden="true" />
          {busyKey === "book-upload" ? "Enviando..." : "Enviar arquivo"}
        </button>
      </form>

      <form className="admin-form admin-form--compact" onSubmit={onSubmitImport}>
        <div className="admin-form-title">
          <LibraryBig aria-hidden="true" />
          <div>
            <strong>Importação de acervo externo</strong>
            <span>Use Open Library para catálogo e Gutenberg para leitura interna.</span>
          </div>
        </div>
        <label className="field-stack">
          <span>Busca na Open Library</span>
          <input aria-label="Busca na Open Library" value={importQuery} onChange={(event) => onImportQueryChange(event.target.value)} placeholder="Ex.: subject:fiction" />
        </label>
        <label className="field-stack">
          <span>Páginas externas</span>
          <input aria-label="Quantidade de páginas para importar" type="number" min={1} value={importPages} onChange={(event) => onImportPagesChange(Number(event.target.value))} />
        </label>
        <label className="field-stack">
          <span>Itens por página</span>
          <input aria-label="Tamanho da página de importação" type="number" min={1} value={importPageSize} onChange={(event) => onImportPageSizeChange(Number(event.target.value))} />
        </label>
        <label className="field-stack">
          <span>Alvo importado</span>
          <input aria-label="Quantidade alvo de livros importados" type="number" min={1} max={500} value={importTargetCount} onChange={(event) => onImportTargetCountChange(Number(event.target.value))} />
        </label>
        <label className="check-inline">
          <input type="checkbox" checked={importReadableOnly} onChange={(event) => onImportReadableOnlyChange(event.target.checked)} />
          Apenas livros com leitor externo
        </label>
        <button type="submit" disabled={busyKey === "book-import"}>
          <LibraryBig aria-hidden="true" />
          {busyKey === "book-import" ? "Importando..." : "Importar Open Library"}
        </button>
        <button type="button" className="btn-muted" disabled={busyKey === "book-import-gutenberg"} onClick={() => void onSubmitGutenbergImport()}>
          <BookPlus aria-hidden="true" />
          {busyKey === "book-import-gutenberg" ? "Gerando PDFs..." : "Importar leitura interna"}
        </button>
      </form>

      {importResult && importStatus && (
        <section className={`admin-import-summary admin-import-summary--${importStatus.tone}`} aria-live="polite">
          <div>
            <p className="eyebrow">Resultado da Open Library</p>
            <h4>{importStatus.title}</h4>
            <p className="section-sub">{importStatus.description}</p>
          </div>
          <div className="admin-import-summary__stats" aria-label="Resumo da importação">
            <span>
              <strong>{importResult.fetched}</strong>
              <small>lidos</small>
            </span>
            <span>
              <strong>{importResult.imported}</strong>
              <small>importados</small>
            </span>
            <span>
              <strong>{importResult.skipped}</strong>
              <small>ignorados</small>
            </span>
            <span>
              <strong>{importResult.failed}</strong>
              <small>falhas</small>
            </span>
          </div>
          {importMessages.length > 0 && (
            <ul className="admin-import-summary__messages" aria-label="Detalhes da importação">
              {importMessages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="section-head">
        <h4>Lista de livros</h4>
        <span className="kpi">{filteredBooks.length}</span>
      </div>
      <input aria-label="Filtrar livros administrativos" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Filtrar por título, autor ou ISBN" />
      <ul className="stacked-list">
        {visibleBooks.map((book) => (
          <li key={book.id} className="stacked-list-item">
            <div className="book-list-row">
              <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
              <div>
                <strong>{book.title}</strong>
                <p className="section-sub">
                  {book.author ?? "Autoria ainda não informada"} · {book.isbn}
                </p>
              </div>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-muted" onClick={() => onEdit(book)}>
                <Edit3 aria-hidden="true" />
                Editar
              </button>
              <button type="button" className="btn-muted btn-danger" disabled={busyKey === `book-delete-${book.id}`} onClick={() => onDelete(book.id)}>
                <Trash2 aria-hidden="true" />
                {busyKey === `book-delete-${book.id}` ? "Removendo..." : "Remover"}
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
