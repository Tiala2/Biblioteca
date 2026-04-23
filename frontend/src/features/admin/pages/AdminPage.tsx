import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "@shared/api/http";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared/ui/toast/ToastContext";
import { AdminHeroPanel } from "../components/AdminHeroPanel";
import { AlertAuditPanel } from "../components/AlertAuditPanel";
import { BadgePanel } from "../components/BadgePanel";
import { BookPanel } from "../components/BookPanel";
import { CategoryPanel } from "../components/CategoryPanel";
import { CollectionPanel } from "../components/CollectionPanel";
import { FavoriteAdminPanel } from "../components/FavoriteAdminPanel";
import { TagPanel } from "../components/TagPanel";
import { UserPanel } from "../components/UserPanel";
import {
  type AlertDeliveryAdmin,
  EMPTY_BADGE,
  EMPTY_BOOK,
  EMPTY_CATEGORY,
  EMPTY_COLLECTION,
  EMPTY_TAG,
  EMPTY_USER,
  type Badge,
  type BadgeForm,
  type Book,
  type BookForm,
  type Category,
  type CategoryForm,
  type Collection,
  type CollectionForm,
  type FavoriteAdmin,
  type ImportResult,
  type Metrics,
  type Page,
  type Tag,
  type TagForm,
  type UserAdmin,
  type UserForm,
} from "../types";

type AdminSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  variant?: "compact" | "wide";
};

function AdminSection({ eyebrow, title, description, children, variant = "compact" }: AdminSectionProps) {
  return (
    <section className={`admin-section admin-section--${variant}`}>
      <div className="admin-section__head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-sub">{description}</p>
      </div>
      <div className="admin-section__grid">{children}</div>
    </section>
  );
}

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
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAdmin[]>([]);
  const [alertDeliveries, setAlertDeliveries] = useState<AlertDeliveryAdmin[]>([]);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [tagForm, setTagForm] = useState<TagForm>(EMPTY_TAG);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(EMPTY_COLLECTION);
  const [bookForm, setBookForm] = useState<BookForm>(EMPTY_BOOK);
  const [badgeForm, setBadgeForm] = useState<BadgeForm>(EMPTY_BADGE);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER);
  const [uploadBookId, setUploadBookId] = useState("");
  const [coverBookId, setCoverBookId] = useState("");
  const [coverBookUrl, setCoverBookUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importQuery, setImportQuery] = useState("programming");
  const [importPages, setImportPages] = useState(1);
  const [importPageSize, setImportPageSize] = useState(20);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const loadAll = async () => {
    if (!headers) return;
    const failedSections: string[] = [];
    const [m, c, t, b, col, bd, u, f, a] = await Promise.allSettled([
      api.get<Metrics>("/api/admin/metrics", { headers }),
      api.get<Category[]>("/api/admin/categories", { headers }),
      api.get<Tag[]>("/api/admin/tags", { headers }),
      api.get<Page<Book>>("/api/v1/books?page=0&size=200&includeWithoutPdf=true"),
      api.get<Page<Collection>>("/api/v1/collections?page=0&size=50&sort=createdAt,desc"),
      api.get<Page<Badge>>("/api/admin/badges?page=0&size=50&sort=code", { headers }),
      api.get<Page<UserAdmin>>("/api/admin/users?page=0&size=50&sort=createdAt,desc", { headers }),
      api.get<Page<FavoriteAdmin>>("/api/admin/favorites?page=0&size=50&sort=createdAt,desc", { headers }),
      api.get<Page<AlertDeliveryAdmin>>("/api/admin/alerts/deliveries?page=0&size=50&sort=createdAt,desc", { headers }),
    ]);

    if (m.status === "fulfilled") {
      setMetrics(m.value.data);
    } else {
      failedSections.push("metricas");
    }

    if (c.status === "fulfilled") {
      setCategories(c.value.data);
    } else {
      failedSections.push("categorias");
    }

    if (t.status === "fulfilled") {
      setTags(t.value.data);
    } else {
      failedSections.push("tags");
    }

    if (b.status === "fulfilled") {
      setBooks(b.value.data.content);
      if (!uploadBookId && b.value.data.content[0]) setUploadBookId(b.value.data.content[0].id);
      if (!coverBookId && b.value.data.content[0]) {
        setCoverBookId(b.value.data.content[0].id);
        setCoverBookUrl(b.value.data.content[0].coverUrl ?? "");
      }
    } else {
      failedSections.push("livros");
    }

    if (col.status === "fulfilled") {
      setCollections(col.value.data.content);
    } else {
      failedSections.push("colecoes");
    }

    if (bd.status === "fulfilled") {
      setBadges(bd.value.data.content);
    } else {
      failedSections.push("badges");
    }

    if (u.status === "fulfilled") {
      setUsers(u.value.data.content);
    } else {
      failedSections.push("usuarios");
    }

    if (f.status === "fulfilled") {
      setFavorites(f.value.data.content);
    } else {
      failedSections.push("favoritos");
    }

    if (a.status === "fulfilled") {
      setAlertDeliveries(a.value.data.content);
    } else {
      failedSections.push("alertas");
    }

    setError(failedSections.length ? `Falha ao carregar: ${failedSections.join(", ")}.` : "");
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const runAction = async (key: string, action: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    setBusyKey(key);
    try {
      await action();
      await loadAll();
      setError("");
      showToast(successMessage, "success");
    } catch {
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setBusyKey(null);
    }
  };

  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !categoryForm.name.trim()) return;
    await runAction(
      categoryForm.id ? `category-save-${categoryForm.id}` : "category-create",
      () =>
        categoryForm.id
          ? api.put(`/api/admin/categories/${categoryForm.id}`, { name: categoryForm.name, description: categoryForm.description }, { headers })
          : api.post("/api/admin/categories", { name: categoryForm.name, description: categoryForm.description }, { headers }),
      categoryForm.id ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.",
      categoryForm.id ? "Falha ao atualizar categoria." : "Falha ao criar categoria."
    );
    setCategoryForm(EMPTY_CATEGORY);
  };

  const submitTag = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !tagForm.name.trim()) return;
    await runAction(
      tagForm.id ? `tag-save-${tagForm.id}` : "tag-create",
      () => (tagForm.id ? api.put(`/api/admin/tags/${tagForm.id}`, { name: tagForm.name }, { headers }) : api.post("/api/admin/tags", { name: tagForm.name }, { headers })),
      tagForm.id ? "Tag atualizada com sucesso." : "Tag criada com sucesso.",
      tagForm.id ? "Falha ao atualizar tag." : "Falha ao criar tag."
    );
    setTagForm(EMPTY_TAG);
  };

  const submitCollection = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !collectionForm.title.trim() || collectionForm.bookIds.length === 0) return;
    await runAction(
      collectionForm.id ? `collection-save-${collectionForm.id}` : "collection-create",
      () =>
        collectionForm.id
          ? api.put(`/api/admin/collections/${collectionForm.id}`, collectionForm, { headers })
          : api.post("/api/admin/collections", collectionForm, { headers }),
      collectionForm.id ? "Colecao atualizada com sucesso." : "Colecao criada com sucesso.",
      collectionForm.id ? "Falha ao atualizar colecao." : "Falha ao criar colecao."
    );
    setCollectionForm(EMPTY_COLLECTION);
  };

  const submitBook = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !bookForm.title.trim() || !bookForm.isbn.trim()) return;
    await runAction(
      bookForm.id ? `book-save-${bookForm.id}` : "book-create",
      () =>
        bookForm.id
          ? api.patch(
              `/api/admin/books/${bookForm.id}`,
              {
                title: bookForm.title,
                author: bookForm.author,
                isbn: bookForm.isbn,
                numberOfPages: bookForm.numberOfPages,
                publicationDate: bookForm.publicationDate,
                coverUrl: bookForm.coverUrl.trim() || null,
                categories: bookForm.categoryIds,
              },
              { headers }
            )
          : api.post(
              "/api/admin/books",
              {
                title: bookForm.title,
                author: bookForm.author,
                isbn: bookForm.isbn,
                numberOfPages: bookForm.numberOfPages,
                publicationDate: bookForm.publicationDate,
                coverUrl: bookForm.coverUrl.trim() || null,
                categories: bookForm.categoryIds,
              },
              { headers }
            ),
      bookForm.id ? "Livro atualizado com sucesso." : "Livro criado com sucesso.",
      bookForm.id ? "Falha ao atualizar livro." : "Falha ao criar livro."
    );
    setBookForm(EMPTY_BOOK);
  };

  const submitBadge = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !badgeForm.name.trim()) return;
    await runAction(
      badgeForm.id ? `badge-save-${badgeForm.id}` : "badge-create",
      () => (badgeForm.id ? api.put(`/api/admin/badges/${badgeForm.id}`, badgeForm, { headers }) : api.post("/api/admin/badges", badgeForm, { headers })),
      badgeForm.id ? "Badge atualizado com sucesso." : "Badge criado com sucesso.",
      badgeForm.id ? "Falha ao atualizar badge." : "Falha ao criar badge."
    );
    setBadgeForm(EMPTY_BADGE);
  };

  const submitUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !userForm.id || !userForm.name.trim() || !userForm.email.trim()) return;
    await runAction(
      `user-save-${userForm.id}`,
      () =>
        api.put(
          `/api/admin/users/${userForm.id}`,
          {
            name: userForm.name,
            email: userForm.email,
            leaderboardOptIn: userForm.leaderboardOptIn,
            alertsOptIn: userForm.alertsOptIn,
          },
          { headers }
        ),
      "Usuario atualizado com sucesso.",
      "Falha ao atualizar usuario."
    );
    setUserForm(EMPTY_USER);
  };

  const removeItem = async (key: string, path: string, successMessage: string, errorMessage: string) => {
    if (!headers) return;
    await runAction(key, () => api.delete(path, { headers }), successMessage, errorMessage);
  };

  const reactivateUser = async (userId: string) => {
    if (!headers) return;
    await runAction(
      `user-reactivate-${userId}`,
      () => api.patch(`/api/admin/users/${userId}/reactivate`, undefined, { headers }),
      "Usuario reativado com sucesso.",
      "Falha ao reativar usuario."
    );
  };

  const uploadPdf = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !uploadBookId || !uploadFile) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    await runAction(
      "book-upload",
      () => api.post(`/api/admin/books/${uploadBookId}/upload`, formData, { headers: { ...headers, "Content-Type": "multipart/form-data" } }),
      "PDF enviado com sucesso.",
      "Falha no upload do PDF."
    );
    setUploadFile(null);
  };

  const updateCover = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !coverBookId) return;
    await runAction(
      "book-cover",
      () => api.patch(`/api/admin/books/${coverBookId}`, { coverUrl: coverBookUrl }, { headers }),
      "Capa do livro atualizada com sucesso.",
      "Falha ao atualizar capa do livro."
    );
  };

  const importBooks = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !importQuery.trim()) return;
    setBusyKey("book-import");
    try {
      const response = await api.post<ImportResult>(
        "/api/admin/books/import/open-library",
        { query: importQuery, pages: Number(importPages), pageSize: Number(importPageSize) },
        { headers }
      );
      setImportResult(response.data);
      await loadAll();
      showToast("Importacao concluida com sucesso.", "success");
    } catch {
      setError("Falha ao importar livros da Open Library.");
      showToast("Falha ao importar livros da Open Library.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section className="admin-page">
      <AdminHeroPanel metrics={metrics} error={error} />

      <nav className="admin-quick-nav" aria-label="Atalhos do painel administrativo">
        <a href="#admin-books">Catalogo</a>
        <a href="#admin-categories">Taxonomia</a>
        <a href="#admin-badges">Engajamento</a>
        <a href="#admin-users">Usuarios</a>
        <a href="#admin-alerts">Auditoria</a>
      </nav>

      <AdminSection
        eyebrow="Catalogo"
        title="Acervo e descoberta"
        description="Cadastre livros, organize categorias, tags e colecoes sem sair do mesmo fluxo."
        variant="wide"
      >
        <BookPanel
          form={bookForm}
          books={books}
          categories={categories}
          busyKey={busyKey}
          uploadBookId={uploadBookId}
          coverBookId={coverBookId}
          coverBookUrl={coverBookUrl}
          importQuery={importQuery}
          importPages={importPages}
          importPageSize={importPageSize}
          importResult={importResult}
          onSubmitBook={submitBook}
          onSubmitUpload={uploadPdf}
          onSubmitCover={updateCover}
          onSubmitImport={importBooks}
          onFormChange={setBookForm}
          onReset={() => setBookForm(EMPTY_BOOK)}
          onEdit={(book) =>
            setBookForm({
              id: book.id,
              title: book.title,
              author: book.author ?? "",
              isbn: book.isbn ?? "",
              numberOfPages: book.numberOfPages ?? 1,
              publicationDate: book.publicationDate ?? "2020-01-01",
              coverUrl: book.coverUrl ?? "",
              categoryIds: book.categories?.map((category) => category.id) ?? [],
            })
          }
          onDelete={(bookId) => void removeItem(`book-delete-${bookId}`, `/api/admin/books/${bookId}`, "Livro removido com sucesso.", "Falha ao deletar livro.")}
          onUploadBookChange={setUploadBookId}
          onCoverBookChange={setCoverBookId}
          onCoverUrlChange={setCoverBookUrl}
          onUploadFileChange={setUploadFile}
          onImportQueryChange={setImportQuery}
          onImportPagesChange={setImportPages}
          onImportPageSizeChange={setImportPageSize}
        />

        <CategoryPanel
          form={categoryForm}
          categories={categories}
          busyKey={busyKey}
          onSubmit={submitCategory}
          onFormChange={setCategoryForm}
          onEdit={(category) => setCategoryForm({ id: category.id, name: category.name, description: category.description ?? "" })}
          onReset={() => setCategoryForm(EMPTY_CATEGORY)}
          onDelete={(categoryId) =>
            void removeItem(`category-delete-${categoryId}`, `/api/admin/categories/${categoryId}`, "Categoria removida com sucesso.", "Falha ao deletar categoria.")
          }
        />

        <TagPanel
          form={tagForm}
          tags={tags}
          busyKey={busyKey}
          onSubmit={submitTag}
          onFormChange={setTagForm}
          onEdit={(tag) => setTagForm({ id: tag.id, name: tag.name })}
          onReset={() => setTagForm(EMPTY_TAG)}
          onDelete={(tagId) => void removeItem(`tag-delete-${tagId}`, `/api/admin/tags/${tagId}`, "Tag removida com sucesso.", "Falha ao deletar tag.")}
        />

        <CollectionPanel
          form={collectionForm}
          collections={collections}
          books={books}
          busyKey={busyKey}
          onSubmit={submitCollection}
          onFormChange={setCollectionForm}
          onEdit={(collection) =>
            setCollectionForm({
              id: collection.id,
              title: collection.title,
              description: collection.description ?? "",
              coverUrl: collection.coverUrl ?? "",
              bookIds: collection.books?.map((book) => book.id) ?? [],
            })
          }
          onReset={() => setCollectionForm(EMPTY_COLLECTION)}
          onDelete={(collectionId) =>
            void removeItem(`collection-delete-${collectionId}`, `/api/admin/collections/${collectionId}`, "Colecao removida com sucesso.", "Falha ao deletar colecao.")
          }
        />
      </AdminSection>

      <AdminSection
        eyebrow="Engajamento"
        title="Gamificacao e comunidade"
        description="Acompanhe mecanismos de permanencia, reputacao social e uso real da plataforma."
      >
        <BadgePanel
          form={badgeForm}
          badges={badges}
          busyKey={busyKey}
          onSubmit={submitBadge}
          onFormChange={setBadgeForm}
          onEdit={(badge) =>
            setBadgeForm({
              id: badge.id,
              code: badge.code,
              name: badge.name,
              description: badge.description ?? "",
              criteriaType: badge.criteriaType,
              criteriaValue: badge.criteriaValue ?? "",
              active: badge.active,
            })
          }
          onReset={() => setBadgeForm(EMPTY_BADGE)}
          onDelete={(badgeId) => void removeItem(`badge-delete-${badgeId}`, `/api/admin/badges/${badgeId}`, "Badge removido com sucesso.", "Falha ao deletar badge.")}
        />

        <FavoriteAdminPanel favorites={favorites} />
      </AdminSection>

      <AdminSection
        eyebrow="Operacao"
        title="Gestao de usuarios"
        description="Edite dados basicos e controle acesso sem apagar historico de leitura, reviews e auditoria."
        variant="wide"
      >
        <UserPanel
          form={userForm}
          users={users}
          currentUserEmail={auth?.email ?? ""}
          busyKey={busyKey}
          onSubmit={submitUser}
          onFormChange={setUserForm}
          onEdit={(user) =>
            setUserForm({
              id: user.id,
              name: user.name,
              email: user.email,
              leaderboardOptIn: user.leaderboardOptIn,
              alertsOptIn: user.alertsOptIn,
            })
          }
          onReset={() => setUserForm(EMPTY_USER)}
          onInvalidate={(userId) =>
            void removeItem(`user-invalidate-${userId}`, `/api/admin/users/${userId}`, "Usuario invalidado com sucesso.", "Falha ao invalidar usuario.")
          }
          onReactivate={(userId) => void reactivateUser(userId)}
        />
      </AdminSection>

      <AdminSection
        eyebrow="Auditoria"
        title="Alertas e rastreabilidade"
        description="Veja entregas de alertas por e-mail, status de envio e mensagens geradas pela plataforma."
      >
        <AlertAuditPanel deliveries={alertDeliveries} />
      </AdminSection>
    </section>
  );
}
