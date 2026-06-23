import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BookPlus, Edit3, ImagePlus, LibraryBig, RotateCcw, Save, Search, Trash2, Upload } from "lucide-react";
import { formatBookSource, formatReadingMode } from "@shared/lib/presentation";
import { BookCover } from "@shared/ui/books/BookCover";
import type { Book, BookForm, Category, ImportProvider, ImportResult } from "../types";
import { focusAdminPanelForm } from "../lib/focus";
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

function getImportStatusForProvider(result: ImportResult | null, provider: ImportProvider) {
  const status = getImportStatus(result);
  if (!result || !status) {
    return null;
  }
  const sourceName = provider === "gutenberg" ? "Project Gutenberg" : "Open Library";

  if (result.imported > 0 && result.failed > 0) {
    return {
      ...status,
      title: "Importação parcial",
      description: `Alguns livros entraram pelo ${sourceName}, mas parte da busca falhou. Você pode tentar novamente sem perder o que já foi importado.`,
    };
  }
  if (result.imported > 0 && provider === "gutenberg") {
    return {
      ...status,
      title: "Importação concluída",
      description: "Os livros encontrados foram adicionados com arquivo gerado para leitura integrada no app.",
    };
  }
  if (result.failed > 0 && provider === "gutenberg") {
    return {
      ...status,
      title: "Importação não concluída",
      description: "O Project Gutenberg demorou ou não retornou livros elegíveis. Tente uma busca menor ou outro tema.",
    };
  }
  return status;
}

function BookAdminBadges({ book }: { book: Book }) {
  return (
    <span className="book-card-badges admin-book-badges" aria-label={`Origem e leitura de ${book.title}`}>
      <span className="import-badge">{formatBookSource(book.source)}</span>
      <span className={book.hasPdf ? "favorite-badge" : "import-badge"}>
        {formatReadingMode(book.hasPdf, book.source)}
      </span>
    </span>
  );
}

type BookPanelProps = {
  form: BookForm;
  books: Book[];
  categories: Category[];
  busyKey: string | null;
  uploadBookId: string;
  uploadFile: File | null;
  createBookFile: File | null;
  coverBookId: string;
  coverBookUrl: string;
  importQuery: string;
  importPages: number;
  importPageSize: number;
  importReadableOnly: boolean;
  importTargetCount: number;
  importLanguage: "pt" | "en";
  importResult: ImportResult | null;
  importProvider: ImportProvider;
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
  onCreateBookFileChange: (file: File | null) => void;
  onImportQueryChange: (value: string) => void;
  onImportPagesChange: (value: number) => void;
  onImportPageSizeChange: (value: number) => void;
  onImportReadableOnlyChange: (value: boolean) => void;
  onImportTargetCountChange: (value: number) => void;
  onImportLanguageChange: (value: "pt" | "en") => void;
};

export function BookPanel({
  form,
  books,
  categories,
  busyKey,
  uploadBookId,
  uploadFile,
  createBookFile,
  coverBookId,
  coverBookUrl,
  importQuery,
  importPages,
  importPageSize,
  importReadableOnly,
  importTargetCount,
  importLanguage,
  importResult,
  importProvider,
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
  onCreateBookFileChange,
  onImportQueryChange,
  onImportPagesChange,
  onImportPageSizeChange,
  onImportReadableOnlyChange,
  onImportTargetCountChange,
  onImportLanguageChange,
}: BookPanelProps) {
  const [search, setSearch] = useState("");
  const [uploadSearch, setUploadSearch] = useState({ bookId: "", value: "" });
  const [coverSearch, setCoverSearch] = useState({ bookId: "", value: "" });
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const pickerLimit = 6;
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
  const coverSearchValue = coverSearch.bookId === coverBookId ? coverSearch.value : selectedCoverBook?.title ?? "";
  const normalizedCoverSearch = coverSearchValue.trim().toLowerCase();
  const coverBookOptions = normalizedCoverSearch
    ? books.filter((book) => `${book.title} ${book.author ?? ""} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedCoverSearch))
    : books;
  const visibleCoverBookOptions = coverBookOptions.slice(0, pickerLimit);
  const uploadSearchValue = uploadSearch.bookId === uploadBookId ? uploadSearch.value : selectedUploadBook?.title ?? "";
  const normalizedUploadSearch = uploadSearchValue.trim().toLowerCase();
  const uploadBookOptions = normalizedUploadSearch
    ? books.filter((book) => `${book.title} ${book.author ?? ""} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedUploadSearch))
    : books;
  const visibleUploadBookOptions = uploadBookOptions.slice(0, pickerLimit);
  const formCoverUrlFromIsbn = buildOpenLibraryCoverUrl(form.isbn);
  const selectedCoverUrlFromIsbn = buildOpenLibraryCoverUrl(selectedCoverBook?.isbn);
  const importStatus = getImportStatusForProvider(importResult, importProvider);
  const importMessages = importResult?.messages?.filter(Boolean).slice(0, 4) ?? [];
  const isImportingBooks = busyKey === "book-import" || busyKey === "book-import-gutenberg";
  const resultSourceLabel = importProvider === "gutenberg" ? "Project Gutenberg" : "Open Library";
  const hasBooks = books.length > 0;

  const editBook = (book: Book) => {
    onEdit(book);
    focusAdminPanelForm("admin-books");
  };
  const selectUploadBook = (book: Book) => {
    onUploadBookChange(book.id);
    setUploadSearch({ bookId: book.id, value: book.title });
  };
  const selectCoverBook = (book: Book) => {
    onCoverBookChange(book.id);
    setCoverSearch({ bookId: book.id, value: book.title });
  };
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
      <h3>{form.id ? "Editar livro" : "Cadastrar livro"}</h3>
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
          Buscar capa automaticamente
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
        {!form.id && (
          <>
            <label className="file-picker">
              <span>Arquivo de leitura</span>
              <strong>{createBookFile?.name ?? "Selecione o PDF do livro"}</strong>
              <input
                className="sr-only"
                aria-label="Arquivo de leitura do novo livro"
                type="file"
                accept="application/pdf"
                onChange={(event) => onCreateBookFileChange(event.target.files?.[0] ?? null)}
              />
            </label>
            <p className="section-sub">
              Para evitar livros sem leitura integrada, o cadastro local só é concluído quando o arquivo é enviado com sucesso.
            </p>
          </>
        )}
        <button type="submit" disabled={busyKey === "book-create" || busyKey === `book-save-${form.id}` || (!form.id && !createBookFile)}>
          <Save aria-hidden="true" />
          {busyKey === "book-create" || busyKey === `book-save-${form.id}`
            ? "Salvando..."
            : form.id
              ? "Salvar livro"
              : "Publicar livro"}
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
          <input
            aria-label="Buscar livro para atualizar capa"
            value={coverSearchValue}
            disabled={!hasBooks}
            onChange={(event) => setCoverSearch({ bookId: coverBookId, value: event.target.value })}
            placeholder="Digite o título, autor ou ISBN"
          />
        </label>
        <div className="admin-book-picker" aria-label="Livros existentes para atualizar capa">
          <span className="sr-only">Resultados da busca de livros para capa</span>
          <div hidden>
            <select aria-label="Livro para atualizar capa" value={coverBookId} disabled={!hasBooks} onChange={(event) => onCoverBookChange(event.target.value)}>
              {!hasBooks && <option value="">Nenhum livro cadastrado</option>}
              {hasBooks && coverBookOptions.length === 0 && <option value="">Nenhum livro encontrado</option>}
              {selectedCoverBook && !visibleCoverBookOptions.some((book) => book.id === selectedCoverBook.id) && (
                <option value={selectedCoverBook.id}>{selectedCoverBook.title}</option>
              )}
              {visibleCoverBookOptions.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>
          {!hasBooks && <p className="section-sub">Nenhum livro cadastrado.</p>}
          {hasBooks && coverBookOptions.length === 0 && <p className="section-sub">Nenhum livro encontrado.</p>}
          {visibleCoverBookOptions.map((book) => (
            <button
              key={book.id}
              type="button"
              className={book.id === coverBookId ? "admin-book-picker__item active" : "admin-book-picker__item"}
              aria-pressed={book.id === coverBookId}
              onClick={() => selectCoverBook(book)}
            >
              <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
              <span className="admin-book-picker__body">
                <strong className="admin-book-title">{book.title}</strong>
                <small className="admin-book-meta">{book.author ?? "Autoria ainda não informada"} · {book.isbn ?? "sem ISBN"}</small>
                <BookAdminBadges book={book} />
              </span>
            </button>
          ))}
          {coverBookOptions.length > visibleCoverBookOptions.length && (
            <small className="section-sub">Mostrando os primeiros {pickerLimit} resultados. Refine a busca para encontrar mais rápido.</small>
          )}
        </div>
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
          {busyKey === "book-cover" ? "Atualizando..." : "Atualizar imagem"}
        </button>
      </form>

      <form className="admin-form admin-form--compact" onSubmit={onSubmitUpload}>
        <div className="admin-form-title">
          <Upload aria-hidden="true" />
          <div>
            <strong>Arquivo de leitura</strong>
            <span>Envie o arquivo para liberar leitura integrada no app.</span>
          </div>
        </div>
        <label className="field-stack">
          <span>Livro para arquivo de leitura</span>
          <input
            aria-label="Buscar livro para enviar arquivo de leitura"
            value={uploadSearchValue}
            disabled={!hasBooks}
            onChange={(event) => setUploadSearch({ bookId: uploadBookId, value: event.target.value })}
            placeholder="Digite o título, autor ou ISBN"
          />
        </label>
        <div className="admin-book-picker" aria-label="Livros existentes para anexar arquivo de leitura">
          <span className="sr-only">Resultados da busca de livros</span>
          <div hidden>
            <select aria-label="Livro para enviar arquivo de leitura" value={uploadBookId} disabled={!hasBooks} onChange={(event) => onUploadBookChange(event.target.value)}>
            {!hasBooks && <option value="">Nenhum livro cadastrado</option>}
            {hasBooks && uploadBookOptions.length === 0 && <option value="">Nenhum livro encontrado</option>}
            {selectedUploadBook && !visibleUploadBookOptions.some((book) => book.id === selectedUploadBook.id) && (
              <option value={selectedUploadBook.id}>{selectedUploadBook.title}</option>
            )}
            {visibleUploadBookOptions.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
            </select>
          </div>
          {!hasBooks && <p className="section-sub">Nenhum livro cadastrado.</p>}
          {hasBooks && uploadBookOptions.length === 0 && <p className="section-sub">Nenhum livro encontrado.</p>}
          {visibleUploadBookOptions.map((book) => (
            <button
              key={book.id}
              type="button"
              className={book.id === uploadBookId ? "admin-book-picker__item active" : "admin-book-picker__item"}
              aria-pressed={book.id === uploadBookId}
              onClick={() => selectUploadBook(book)}
            >
              <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
              <span className="admin-book-picker__body">
                <strong className="admin-book-title">{book.title}</strong>
                <small className="admin-book-meta">{book.author ?? "Autoria ainda não informada"} · {book.isbn ?? "sem ISBN"}</small>
                <BookAdminBadges book={book} />
              </span>
            </button>
          ))}
          {uploadBookOptions.length > visibleUploadBookOptions.length && (
            <small className="section-sub">Mostrando os primeiros {pickerLimit} resultados. Refine a busca para encontrar mais rápido.</small>
          )}
        </div>
        <label className="file-picker">
          <span>Selecionar arquivo de leitura</span>
          <strong>{uploadFile?.name ?? "Nenhum arquivo selecionado"}</strong>
          <input className="sr-only" aria-label="Arquivo de leitura do livro" type="file" accept="application/pdf" onChange={(event) => onUploadFileChange(event.target.files?.[0] ?? null)} />
        </label>
        {selectedUploadBook && (
          <p className="section-sub admin-selected-book">
            Arquivo selecionado para <strong>{selectedUploadBook.title}</strong>.
            <span className={selectedUploadBook.hasPdf ? "favorite-badge" : "import-badge"}>
              {selectedUploadBook.hasPdf ? "Substitui arquivo atual" : "Primeiro arquivo deste livro"}
            </span>
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
            <span>Use Open Library para descoberta e Gutenberg quando precisar de leitura integrada.</span>
          </div>
        </div>
        <label className="field-stack">
          <span>Termo de busca</span>
          <input aria-label="Termo de busca da importação" value={importQuery} onChange={(event) => onImportQueryChange(event.target.value)} placeholder="Ex.: fiction ou subject:fiction" />
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
        <label className="field-stack">
          <span>Idioma do acervo</span>
          <select aria-label="Idioma da importação" value={importLanguage} onChange={(event) => onImportLanguageChange(event.target.value as "pt" | "en")}>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
          </select>
        </label>
        <label className="check-inline">
          <input type="checkbox" checked={importReadableOnly} onChange={(event) => onImportReadableOnlyChange(event.target.checked)} />
          Apenas livros com leitor externo
        </label>
        <p className="section-sub admin-import-hint">
          Gutenberg pode demorar alguns minutos porque baixa texto, gera PDF e salva o arquivo no leitor interno.
        </p>
        <button type="submit" disabled={isImportingBooks}>
          <LibraryBig aria-hidden="true" />
          {busyKey === "book-import" ? "Importando..." : "Importar Open Library"}
        </button>
        <button type="button" className="btn-muted" disabled={isImportingBooks} onClick={() => void onSubmitGutenbergImport()}>
          <BookPlus aria-hidden="true" />
          {busyKey === "book-import-gutenberg" ? "Gerando arquivos..." : "Importar leitura integrada"}
        </button>
      </form>

      {importResult && importStatus && (
        <section className={`admin-import-summary admin-import-summary--${importStatus.tone}`} aria-live="polite">
          <div>
            <p className="eyebrow">Resultado: {resultSourceLabel}</p>
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
        <h4>Acervo cadastrado</h4>
        <span className="kpi">{filteredBooks.length}</span>
      </div>
      <input aria-label="Filtrar livros administrativos" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Buscar no acervo por título, autor ou ISBN" />
      <ul className="stacked-list">
        {visibleBooks.map((book) => (
          <li key={book.id} className="stacked-list-item admin-book-list-item">
            <button type="button" className="book-list-row book-list-row--action" onClick={() => editBook(book)}>
              <BookCover title={book.title} coverUrl={book.coverUrl} isbn={book.isbn} size="small" />
              <div className="admin-book-row__body">
                <strong className="admin-book-title">{book.title}</strong>
                <p className="section-sub admin-book-meta">
                  {book.author ?? "Autoria ainda não informada"} · {book.isbn ?? "sem ISBN"}
                </p>
                <BookAdminBadges book={book} />
              </div>
            </button>
            <div className="card-actions admin-list-actions">
              <button type="button" className="btn-muted" onClick={() => editBook(book)}>
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
