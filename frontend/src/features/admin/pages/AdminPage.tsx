import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";
import { BookCover } from "@shared/ui/books/BookCover";

type Metrics = {
  totalUsers: number;
  totalBooks: number;
  totalReviews: number;
  totalFavorites: number;
  totalCollections: number;
  totalTags: number;
};

type Category = { id: string; name: string; description?: string };
type Tag = { id: string; name: string };
type Book = { id: string; title: string; coverUrl?: string | null };
type Collection = { id: string; title: string };
type Badge = { id: string; code: string; name: string; criteriaType: string; criteriaValue?: string; active: boolean };
type Page<T> = { content: T[] };
type ImportResult = { fetched: number; imported: number; skipped: number; failed: number; messages: string[] };

const BADGE_CODES = [
  "FIRST_BOOK_FINISHED",
  "STREAK_7_DAYS",
  "STREAK_30_DAYS",
  "TOTAL_BOOKS_10",
  "TOTAL_PAGES_1000",
] as const;

const BADGE_CRITERIA = ["FIRST_BOOK", "STREAK_DAYS", "TOTAL_BOOKS", "TOTAL_PAGES"] as const;

export function AdminPage() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const headers = auth ? { Authorization: `Bearer ${auth.token}` } : undefined;

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [error, setError] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [tagName, setTagName] = useState("");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionBookId, setCollectionBookId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookPages, setBookPages] = useState(150);
  const [bookDate, setBookDate] = useState("2020-01-01");
  const [bookCoverUrl, setBookCoverUrl] = useState("");
  const [badgeCode, setBadgeCode] = useState<(typeof BADGE_CODES)[number]>("TOTAL_BOOKS_10");
  const [badgeName, setBadgeName] = useState("Meta de 10 livros");
  const [badgeCriteria, setBadgeCriteria] =
    useState<(typeof BADGE_CRITERIA)[number]>("TOTAL_BOOKS");
  const [badgeValue, setBadgeValue] = useState("10");
  const [importQuery, setImportQuery] = useState("programming");
  const [importPages, setImportPages] = useState(1);
  const [importPageSize, setImportPageSize] = useState(20);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadBookId, setUploadBookId] = useState("");
  const [coverBookId, setCoverBookId] = useState("");
  const [coverBookUrl, setCoverBookUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [creatingBook, setCreatingBook] = useState(false);
  const [creatingBadge, setCreatingBadge] = useState(false);
  const [importingBooks, setImportingBooks] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [updatingBookCover, setUpdatingBookCover] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const selectedCoverBook = books.find((book) => book.id === coverBookId) ?? null;

  const loadAll = async () => {
    if (!headers) return;
    try {
      const [m, c, t, b, col, bd] = await Promise.all([
        api.get<Metrics>("/api/admin/metrics", { headers }),
        api.get<Category[]>("/api/v1/categories"),
        api.get<Tag[]>("/api/v1/tags"),
        api.get<Page<Book>>("/api/v1/books?page=0&size=30&includeWithoutPdf=true"),
        api.get<Page<Collection>>("/api/v1/collections?page=0&size=30"),
        api.get<Page<Badge>>("/api/admin/badges?page=0&size=30&sort=code", { headers }),
      ]);

      setMetrics(m.data);
      setCategories(c.data);
      setTags(t.data);
      setBooks(b.data.content);
      setCollections(col.data.content);
      setBadges(bd.data.content);
      setError("");

      if (!collectionBookId && b.data.content.length > 0) {
        setCollectionBookId(b.data.content[0].id);
      }

      if (!uploadBookId && b.data.content.length > 0) {
        setUploadBookId(b.data.content[0].id);
      }

      if (!coverBookId && b.data.content.length > 0) {
        setCoverBookId(b.data.content[0].id);
        setCoverBookUrl(b.data.content[0].coverUrl ?? "");
      }
    } catch {
      setError("Falha ao carregar dados admin.");
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const createCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    if (!categoryName.trim()) {
      showToast("Informe o nome da categoria.", "error");
      return;
    }
    setCreatingCategory(true);
    try {
      await api.post("/api/admin/categories", { name: categoryName, description: categoryDescription }, { headers });
      setCategoryName("");
      setCategoryDescription("");
      await loadAll();
      showToast("Categoria criada com sucesso.", "success");
    } catch {
      setError("Falha ao criar categoria.");
      showToast("Falha ao criar categoria.", "error");
    } finally {
      setCreatingCategory(false);
    }
  };

  const createTag = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    if (!tagName.trim()) {
      showToast("Informe o nome da tag.", "error");
      return;
    }
    setCreatingTag(true);
    try {
      await api.post("/api/admin/tags", { name: tagName }, { headers });
      setTagName("");
      await loadAll();
      showToast("Tag criada com sucesso.", "success");
    } catch {
      setError("Falha ao criar tag.");
      showToast("Falha ao criar tag.", "error");
    } finally {
      setCreatingTag(false);
    }
  };

  const createCollection = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !collectionBookId) return;
    if (!collectionTitle.trim()) {
      showToast("Informe o titulo da colecao.", "error");
      return;
    }
    setCreatingCollection(true);
    try {
      await api.post(
        "/api/admin/collections",
        {
          title: collectionTitle,
          description: "Colecao criada no painel admin",
          coverUrl: "https://example.com/cover.jpg",
          bookIds: [collectionBookId],
        },
        { headers }
      );
      setCollectionTitle("");
      await loadAll();
      showToast("Colecao criada com sucesso.", "success");
    } catch {
      setError("Falha ao criar colecao.");
      showToast("Falha ao criar colecao.", "error");
    } finally {
      setCreatingCollection(false);
    }
  };

  const createBook = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    if (!bookTitle.trim() || !bookIsbn.trim()) {
      showToast("Informe titulo e ISBN do livro.", "error");
      return;
    }
    if (bookPages < 1) {
      showToast("Numero de paginas deve ser maior que zero.", "error");
      return;
    }
    setCreatingBook(true);
    try {
      await api.post(
        "/api/admin/books",
        {
          title: bookTitle,
          isbn: bookIsbn,
          numberOfPages: Number(bookPages),
          publicationDate: bookDate,
          coverUrl: bookCoverUrl.trim() || null,
          categories: [],
        },
        { headers }
      );
      setBookTitle("");
      setBookIsbn("");
      setBookCoverUrl("");
      await loadAll();
      showToast("Livro criado com sucesso.", "success");
    } catch {
      setError("Falha ao criar livro.");
      showToast("Falha ao criar livro.", "error");
    } finally {
      setCreatingBook(false);
    }
  };

  const createBadge = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    if (!badgeName.trim()) {
      showToast("Informe o nome do badge.", "error");
      return;
    }
    setCreatingBadge(true);
    try {
      await api.post(
        "/api/admin/badges",
        {
          code: badgeCode,
          name: badgeName,
          description: badgeName,
          criteriaType: badgeCriteria,
          criteriaValue: badgeValue,
          active: true,
        },
        { headers }
      );
      await loadAll();
      showToast("Badge criado com sucesso.", "success");
    } catch {
      setError("Falha ao criar badge (pode ja existir).");
      showToast("Falha ao criar badge.", "error");
    } finally {
      setCreatingBadge(false);
    }
  };

  const importBooks = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    if (!importQuery.trim()) {
      showToast("Informe o termo de busca para importacao.", "error");
      return;
    }
    setImportingBooks(true);
    try {
      const response = await api.post<ImportResult>(
        "/api/admin/books/import/open-library",
        {
          query: importQuery,
          pages: Number(importPages),
          pageSize: Number(importPageSize),
        },
        { headers }
      );
      setImportResult(response.data);
      await loadAll();
      showToast(
        `Importacao concluida: ${response.data.imported} importados e ${response.data.skipped} pulados.`,
        "success"
      );
    } catch {
      setError("Falha ao importar livros da Open Library.");
      showToast("Falha ao importar livros da Open Library.", "error");
    } finally {
      setImportingBooks(false);
    }
  };

  const uploadPdf = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers) return;
    if (!uploadBookId || !uploadFile) {
      showToast("Selecione livro e arquivo PDF.", "error");
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadFile);
    setUploadingPdf(true);
    try {
      await api.post(`/api/admin/books/${uploadBookId}/upload`, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadFile(null);
      await loadAll();
      showToast("PDF enviado com sucesso.", "success");
    } catch {
      showToast("Falha no upload do PDF.", "error");
    } finally {
      setUploadingPdf(false);
    }
  };

  const updateBookCover = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !coverBookId) return;

    setUpdatingBookCover(true);
    try {
      await api.patch(
        `/api/admin/books/${coverBookId}`,
        {
          coverUrl: coverBookUrl,
        },
        { headers }
      );
      await loadAll();
      showToast("Capa do livro atualizada com sucesso.", "success");
    } catch {
      setError("Falha ao atualizar capa do livro.");
      showToast("Falha ao atualizar capa do livro.", "error");
    } finally {
      setUpdatingBookCover(false);
    }
  };

  const deleteByPath = async (key: string, path: string, message: string, successMessage: string) => {
    if (!headers) return;
    setDeletingKey(key);
    try {
      await api.delete(path, { headers });
      await loadAll();
      showToast(successMessage, "success");
    } catch {
      setError(message);
      showToast(message, "error");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <section className="grid">
      <article className="card hero" id="admin-metrics">
        <div className="section-head">
          <div>
            <h2>Painel administrativo</h2>
            <p>
              Aqui ficam as acoes que mais ajudam na avaliacao do projeto:
              cadastro de catalogo, badges, importacao e upload de PDF.
            </p>
          </div>
          <span className="kpi">Perfil ADMIN</span>
        </div>
        <div className="card-actions">
          <a className="btn-link" href="#admin-books">Livros</a>
          <a className="btn-link" href="#admin-categories">Categorias</a>
          <a className="btn-link" href="#admin-badges">Badges</a>
        </div>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Indicadores do sistema</h3>
          <span className="kpi">Visao geral</span>
        </div>
        {metrics ? (
          <div className="stats-grid">
            <div className="stat-box">
              <strong>{metrics.totalUsers}</strong>
              <span>usuarios</span>
            </div>
            <div className="stat-box">
              <strong>{metrics.totalBooks}</strong>
              <span>livros</span>
            </div>
            <div className="stat-box">
              <strong>{metrics.totalReviews}</strong>
              <span>reviews</span>
            </div>
            <div className="stat-box">
              <strong>{metrics.totalFavorites}</strong>
              <span>favoritos</span>
            </div>
            <div className="stat-box">
              <strong>{metrics.totalCollections}</strong>
              <span>colecoes</span>
            </div>
            <div className="stat-box">
              <strong>{metrics.totalTags}</strong>
              <span>tags</span>
            </div>
          </div>
        ) : (
          <p className="section-sub">Carregando indicadores...</p>
        )}
        {error && <p className="error">{error}</p>}
      </article>

      <article className="card" id="admin-categories">
        <div className="section-head">
          <h3>Categorias</h3>
          <span className="kpi">{categories.length} cadastrada(s)</span>
        </div>
        <form className="admin-form" onSubmit={createCategory}>
          <input
            placeholder="Nome da categoria"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            required
          />
          <input
            placeholder="Descricao"
            value={categoryDescription}
            onChange={(event) => setCategoryDescription(event.target.value)}
          />
          <button type="submit" disabled={creatingCategory}>
            {creatingCategory ? "Criando..." : "Criar categoria"}
          </button>
        </form>
        <ul className="stacked-list">
          {categories.slice(0, 6).map((category) => (
            <li key={category.id} className="stacked-list-item">
              <div>
                <strong>{category.name}</strong>
                <p className="section-sub">{category.description || "Sem descricao"}</p>
              </div>
              <button
                className="btn-muted"
                onClick={() =>
                  deleteByPath(
                    `category-${category.id}`,
                    `/api/admin/categories/${category.id}`,
                    "Falha ao deletar categoria.",
                    "Categoria removida com sucesso."
                  )
                }
                disabled={deletingKey === `category-${category.id}`}
              >
                {deletingKey === `category-${category.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Tags</h3>
          <span className="kpi">{tags.length} cadastrada(s)</span>
        </div>
        <form className="admin-form" onSubmit={createTag}>
          <input placeholder="Nome da tag" value={tagName} onChange={(event) => setTagName(event.target.value)} required />
          <button type="submit" disabled={creatingTag}>
            {creatingTag ? "Criando..." : "Criar tag"}
          </button>
        </form>
        <ul className="stacked-list">
          {tags.slice(0, 8).map((tag) => (
            <li key={tag.id} className="stacked-list-item">
              <div>
                <strong>{tag.name}</strong>
              </div>
              <button
                className="btn-muted"
                onClick={() =>
                  deleteByPath(
                    `tag-${tag.id}`,
                    `/api/admin/tags/${tag.id}`,
                    "Falha ao deletar tag.",
                    "Tag removida com sucesso."
                  )
                }
                disabled={deletingKey === `tag-${tag.id}`}
              >
                {deletingKey === `tag-${tag.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <div className="section-head">
          <h3>Colecoes</h3>
          <span className="kpi">{collections.length} cadastrada(s)</span>
        </div>
        <form className="admin-form" onSubmit={createCollection}>
          <input
            placeholder="Titulo da colecao"
            value={collectionTitle}
            onChange={(event) => setCollectionTitle(event.target.value)}
            required
          />
          <select value={collectionBookId} onChange={(event) => setCollectionBookId(event.target.value)}>
            {books.map((book) => (
              <option value={book.id} key={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          <button type="submit" disabled={creatingCollection}>
            {creatingCollection ? "Criando..." : "Criar colecao"}
          </button>
        </form>
        <ul className="stacked-list">
          {collections.slice(0, 6).map((collection) => (
            <li key={collection.id} className="stacked-list-item">
              <div>
                <strong>{collection.title}</strong>
              </div>
              <button
                className="btn-muted"
                onClick={() =>
                  deleteByPath(
                    `collection-${collection.id}`,
                    `/api/admin/collections/${collection.id}`,
                    "Falha ao deletar colecao.",
                    "Colecao removida com sucesso."
                  )
                }
                disabled={deletingKey === `collection-${collection.id}`}
              >
                {deletingKey === `collection-${collection.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="card" id="admin-books">
        <div className="section-head">
          <h3>Livros</h3>
          <span className="kpi">{books.length} carregado(s)</span>
        </div>

        <div className="admin-subsection">
          <h4>Criar livro</h4>
          <form className="admin-form" onSubmit={createBook}>
            <input placeholder="Titulo do livro" value={bookTitle} onChange={(event) => setBookTitle(event.target.value)} required />
            <input placeholder="ISBN" value={bookIsbn} onChange={(event) => setBookIsbn(event.target.value)} required />
            <input type="number" min={1} value={bookPages} onChange={(event) => setBookPages(Number(event.target.value))} required />
            <input type="date" value={bookDate} onChange={(event) => setBookDate(event.target.value)} required />
            <input
              placeholder="URL da capa (opcional)"
              value={bookCoverUrl}
              onChange={(event) => setBookCoverUrl(event.target.value)}
            />
            <button type="submit" disabled={creatingBook}>
              {creatingBook ? "Criando..." : "Criar livro"}
            </button>
          </form>
          <p className="section-sub">
            Dica: use uma URL direta de imagem (`.jpg`, `.png` ou `.webp`) para a capa aparecer no sistema inteiro.
          </p>
        </div>

        <div className="admin-subsection">
          <h4>Atualizar capa do livro</h4>
          <form className="admin-form" onSubmit={updateBookCover}>
            <select
              value={coverBookId}
              onChange={(event) => {
                const selectedId = event.target.value;
                setCoverBookId(selectedId);
                const selectedBook = books.find((book) => book.id === selectedId);
                setCoverBookUrl(selectedBook?.coverUrl ?? "");
              }}
              required
            >
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
            <input
              placeholder="URL da nova capa"
              value={coverBookUrl}
              onChange={(event) => setCoverBookUrl(event.target.value)}
            />
            <button type="submit" disabled={updatingBookCover || books.length === 0}>
              {updatingBookCover ? "Salvando..." : "Salvar capa"}
            </button>
          </form>
          {selectedCoverBook && (
            <div className="inline-book-row">
              <BookCover
                title={selectedCoverBook.title}
                coverUrl={coverBookUrl.trim() || selectedCoverBook.coverUrl}
                size="small"
              />
              <div>
                <strong>{selectedCoverBook.title}</strong>
                <p className="section-sub">
                  Se o campo ficar vazio, a capa visual padrao continua sendo usada.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="admin-subsection">
          <h4>Upload de PDF</h4>
          <form className="admin-form" onSubmit={uploadPdf}>
            <select value={uploadBookId} onChange={(event) => setUploadBookId(event.target.value)} required>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              required
            />
            <button type="submit" disabled={uploadingPdf || books.length === 0}>
              {uploadingPdf ? "Enviando..." : "Enviar PDF"}
            </button>
          </form>
        </div>

        <div className="admin-subsection">
          <div className="section-head">
            <h4>Importar da Open Library</h4>
            <span className="kpi">Acervo externo</span>
          </div>
          <form className="admin-form" onSubmit={importBooks}>
            <input
              placeholder="Termo de busca"
              value={importQuery}
              onChange={(event) => setImportQuery(event.target.value)}
              required
            />
            <input
              type="number"
              min={1}
              max={20}
              value={importPages}
              onChange={(event) => setImportPages(Number(event.target.value))}
              required
            />
            <input
              type="number"
              min={1}
              max={100}
              value={importPageSize}
              onChange={(event) => setImportPageSize(Number(event.target.value))}
              required
            />
            <button type="submit" disabled={importingBooks}>
              {importingBooks ? "Importando..." : "Importar livros"}
            </button>
          </form>
          {importResult && (
            <div className="stats-grid">
              <div className="stat-box">
                <strong>{importResult.imported}</strong>
                <span>importados</span>
              </div>
              <div className="stat-box">
                <strong>{importResult.skipped}</strong>
                <span>pulados</span>
              </div>
              <div className="stat-box">
                <strong>{importResult.failed}</strong>
                <span>falhas</span>
              </div>
              <div className="stat-box">
                <strong>{importResult.fetched}</strong>
                <span>lidos</span>
              </div>
            </div>
          )}
        </div>
      </article>

      <article className="card" id="admin-badges">
        <div className="section-head">
          <h3>Badges</h3>
          <span className="kpi">{badges.length} configurado(s)</span>
        </div>
        <form className="admin-form" onSubmit={createBadge}>
          <select value={badgeCode} onChange={(event) => setBadgeCode(event.target.value as (typeof BADGE_CODES)[number])}>
            {BADGE_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input value={badgeName} onChange={(event) => setBadgeName(event.target.value)} placeholder="Nome do badge" />
          <select
            value={badgeCriteria}
            onChange={(event) => setBadgeCriteria(event.target.value as (typeof BADGE_CRITERIA)[number])}
          >
            {BADGE_CRITERIA.map((criteria) => (
              <option key={criteria} value={criteria}>
                {criteria}
              </option>
            ))}
          </select>
          <input value={badgeValue} onChange={(event) => setBadgeValue(event.target.value)} placeholder="Valor criterio" required />
          <button type="submit" disabled={creatingBadge}>
            {creatingBadge ? "Criando..." : "Criar badge"}
          </button>
        </form>
        <ul className="stacked-list">
          {badges.slice(0, 6).map((badge) => (
            <li key={badge.id} className="stacked-list-item">
              <div>
                <strong>{badge.name}</strong>
                <p className="section-sub">
                  {badge.code} | {badge.criteriaType} | {badge.criteriaValue ?? "sem valor"}
                </p>
              </div>
              <button
                className="btn-muted"
                onClick={() =>
                  deleteByPath(
                    `badge-${badge.id}`,
                    `/api/admin/badges/${badge.id}`,
                    "Falha ao deletar badge.",
                    "Badge removido com sucesso."
                  )
                }
                disabled={deletingKey === `badge-${badge.id}`}
              >
                {deletingKey === `badge-${badge.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
