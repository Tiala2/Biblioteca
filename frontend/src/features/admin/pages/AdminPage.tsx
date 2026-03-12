import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";

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
type Book = { id: string; title: string };
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [creatingBook, setCreatingBook] = useState(false);
  const [creatingBadge, setCreatingBadge] = useState(false);
  const [importingBooks, setImportingBooks] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

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
    } catch {
      setError("Falha ao carregar dados admin.");
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const createCategory = async (e: FormEvent) => {
    e.preventDefault();
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

  const createTag = async (e: FormEvent) => {
    e.preventDefault();
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

  const createCollection = async (e: FormEvent) => {
    e.preventDefault();
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

  const createBook = async (e: FormEvent) => {
    e.preventDefault();
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
          categories: [],
        },
        { headers }
      );
      setBookTitle("");
      setBookIsbn("");
      await loadAll();
      showToast("Livro criado com sucesso.", "success");
    } catch {
      setError("Falha ao criar livro.");
      showToast("Falha ao criar livro.", "error");
    } finally {
      setCreatingBook(false);
    }
  };

  const createBadge = async (e: FormEvent) => {
    e.preventDefault();
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

  const importBooks = async (e: FormEvent) => {
    e.preventDefault();
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

  const uploadPdf = async (e: FormEvent) => {
    e.preventDefault();
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

  const deleteByPath = async (key: string, path: string, msg: string, successMsg: string) => {
    if (!headers) return;
    setDeletingKey(key);
    try {
      await api.delete(path, { headers });
      await loadAll();
      showToast(successMsg, "success");
    } catch {
      setError(msg);
      showToast(msg, "error");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <section className="grid">
      <article className="card" id="admin-metrics">
        <h2>Painel Admin</h2>
        {metrics && (
          <>
            <p>Usuarios: {metrics.totalUsers}</p>
            <p>Livros: {metrics.totalBooks}</p>
            <p>Reviews: {metrics.totalReviews}</p>
            <p>Favoritos: {metrics.totalFavorites}</p>
            <p>Colecoes: {metrics.totalCollections}</p>
            <p>Tags: {metrics.totalTags}</p>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </article>

      <article className="card" id="admin-categories">
        <h3>Categorias</h3>
        <form onSubmit={createCategory}>
          <input placeholder="Nome da categoria" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          <input
            placeholder="Descricao"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
          />
          <button type="submit" disabled={creatingCategory}>{creatingCategory ? "Criando..." : "Criar categoria"}</button>
        </form>
        <ul>
          {categories.slice(0, 6).map((c) => (
            <li key={c.id}>
              {c.name}{" "}
              <button
                onClick={() =>
                  deleteByPath(
                    `category-${c.id}`,
                    `/api/admin/categories/${c.id}`,
                    "Falha ao deletar categoria.",
                    "Categoria removida com sucesso."
                  )
                }
                disabled={deletingKey === `category-${c.id}`}
              >
                {deletingKey === `category-${c.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h3>Tags</h3>
        <form onSubmit={createTag}>
          <input placeholder="Nome da tag" value={tagName} onChange={(e) => setTagName(e.target.value)} required />
          <button type="submit" disabled={creatingTag}>{creatingTag ? "Criando..." : "Criar tag"}</button>
        </form>
        <ul>
          {tags.slice(0, 8).map((t) => (
            <li key={t.id}>
              {t.name}{" "}
              <button
                onClick={() =>
                  deleteByPath(
                    `tag-${t.id}`,
                    `/api/admin/tags/${t.id}`,
                    "Falha ao deletar tag.",
                    "Tag removida com sucesso."
                  )
                }
                disabled={deletingKey === `tag-${t.id}`}
              >
                {deletingKey === `tag-${t.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h3>Colecoes</h3>
        <form onSubmit={createCollection}>
          <input
            placeholder="Titulo da colecao"
            value={collectionTitle}
            onChange={(e) => setCollectionTitle(e.target.value)}
            required
          />
          <select value={collectionBookId} onChange={(e) => setCollectionBookId(e.target.value)}>
            {books.map((b) => (
              <option value={b.id} key={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          <button type="submit" disabled={creatingCollection}>
            {creatingCollection ? "Criando..." : "Criar colecao"}
          </button>
        </form>
        <ul>
          {collections.slice(0, 6).map((c) => (
            <li key={c.id}>
              {c.title}{" "}
              <button
                onClick={() =>
                  deleteByPath(
                    `collection-${c.id}`,
                    `/api/admin/collections/${c.id}`,
                    "Falha ao deletar colecao.",
                    "Colecao removida com sucesso."
                  )
                }
                disabled={deletingKey === `collection-${c.id}`}
              >
                {deletingKey === `collection-${c.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="card" id="admin-books">
        <h3>Livros</h3>
        <form onSubmit={createBook}>
          <input placeholder="Titulo do livro" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} required />
          <input placeholder="ISBN" value={bookIsbn} onChange={(e) => setBookIsbn(e.target.value)} required />
          <input type="number" min={1} value={bookPages} onChange={(e) => setBookPages(Number(e.target.value))} required />
          <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} required />
          <button type="submit" disabled={creatingBook}>{creatingBook ? "Criando..." : "Criar livro"}</button>
        </form>
        <hr />
        <h4>Upload de PDF</h4>
        <form onSubmit={uploadPdf}>
          <select value={uploadBookId} onChange={(e) => setUploadBookId(e.target.value)} required>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            required
          />
          <button type="submit" disabled={uploadingPdf || books.length === 0}>
            {uploadingPdf ? "Enviando..." : "Enviar PDF"}
          </button>
        </form>
        <hr />
        <h4>Importar da Open Library</h4>
        <form onSubmit={importBooks}>
          <input
            placeholder="Termo de busca"
            value={importQuery}
            onChange={(e) => setImportQuery(e.target.value)}
            required
          />
          <input
            type="number"
            min={1}
            max={20}
            value={importPages}
            onChange={(e) => setImportPages(Number(e.target.value))}
            required
          />
          <input
            type="number"
            min={1}
            max={100}
            value={importPageSize}
            onChange={(e) => setImportPageSize(Number(e.target.value))}
            required
          />
          <button type="submit" disabled={importingBooks}>
            {importingBooks ? "Importando..." : "Importar livros"}
          </button>
        </form>
        {importResult && (
          <p>
            Importação: {importResult.imported} importados, {importResult.skipped} pulados, {importResult.failed} falhas
            (lidos: {importResult.fetched})
          </p>
        )}
      </article>

      <article className="card" id="admin-badges">
        <h3>Badges</h3>
        <form onSubmit={createBadge}>
          <select value={badgeCode} onChange={(e) => setBadgeCode(e.target.value as (typeof BADGE_CODES)[number])}>
            {BADGE_CODES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} placeholder="Nome do badge" />
          <select
            value={badgeCriteria}
            onChange={(e) => setBadgeCriteria(e.target.value as (typeof BADGE_CRITERIA)[number])}
          >
            {BADGE_CRITERIA.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input value={badgeValue} onChange={(e) => setBadgeValue(e.target.value)} placeholder="Valor criterio" required />
          <button type="submit" disabled={creatingBadge}>{creatingBadge ? "Criando..." : "Criar badge"}</button>
        </form>
        <ul>
          {badges.slice(0, 6).map((b) => (
            <li key={b.id}>
              {b.code}{" "}
              <button
                onClick={() =>
                  deleteByPath(
                    `badge-${b.id}`,
                    `/api/admin/badges/${b.id}`,
                    "Falha ao deletar badge.",
                    "Badge removido com sucesso."
                  )
                }
                disabled={deletingKey === `badge-${b.id}`}
              >
                {deletingKey === `badge-${b.id}` ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

