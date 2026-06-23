import { useEffect, useState } from "react";
import { Bell, Gauge, LibraryBig, Sparkles, UsersRound } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";
import { useAuthHeaders } from "@shared/hooks/useAuthHeaders";
import { useToast } from "@shared/ui/toast/ToastContext";
import { AdminAlertsSection } from "../components/AdminAlertsSection";
import { AdminCatalogSection } from "../components/AdminCatalogSection";
import { AdminEngagementSection } from "../components/AdminEngagementSection";
import { AdminHeroPanel } from "../components/AdminHeroPanel";
import { AdminUsersSection } from "../components/AdminUsersSection";
import { useAdminActions } from "../hooks/useAdminActions";
import { useAdminAlerts } from "../hooks/useAdminAlerts";
import { useAdminStaticData } from "../hooks/useAdminStaticData";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminSectionKey } from "../lib/sections";
import { ADMIN_ROUTE_SECTION, ADMIN_SECTION_IDS } from "../lib/sections";
import {
  EMPTY_BADGE,
  EMPTY_BOOK,
  EMPTY_CATEGORY,
  EMPTY_COLLECTION,
  EMPTY_TAG,
  EMPTY_USER,
  type BadgeForm,
  type BookForm,
  type CategoryForm,
  type CollectionForm,
  type ImportProvider,
  type ImportResult,
  type TagForm,
  type UserForm,
} from "../types";

type AdminPageProps = {
  visibleSections?: AdminSectionKey[];
};

export function AdminPage({ visibleSections = ["catalog", "engagement", "users", "alerts"] }: AdminPageProps) {
  const { auth } = useAuth();
  const headers = useAuthHeaders();
  const { showToast } = useToast();
  const { pathname } = useLocation();

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [tagForm, setTagForm] = useState<TagForm>(EMPTY_TAG);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(EMPTY_COLLECTION);
  const [bookForm, setBookForm] = useState<BookForm>(EMPTY_BOOK);
  const [badgeForm, setBadgeForm] = useState<BadgeForm>(EMPTY_BADGE);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [createBookFile, setCreateBookFile] = useState<File | null>(null);
  const [importQuery, setImportQuery] = useState("subject:fiction");
  const [importPages, setImportPages] = useState(10);
  const [importPageSize, setImportPageSize] = useState(100);
  const [importReadableOnly, setImportReadableOnly] = useState(true);
  const [importTargetCount, setImportTargetCount] = useState(100);
  const [importLanguage, setImportLanguage] = useState<"pt" | "en">("pt");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProvider, setImportProvider] = useState<ImportProvider>("open-library");
  const staticData = useAdminStaticData({ headers });
  const userAdmin = useAdminUsers({ headers });
  const alertAdmin = useAdminAlerts({ headers });
  const loadAll = async () => Promise.all([staticData.reload(), userAdmin.reload(), alertAdmin.reload()]);

  useEffect(() => {
    const section = ADMIN_ROUTE_SECTION[pathname];
    if (!section || visibleSections.length !== 4) return;
    const sectionId = ADMIN_SECTION_IDS[section];
    if (!sectionId) return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pathname, visibleSections]);

  const actions = useAdminActions({
    headers,
    showToast,
    reloadAll: async () => {
      await loadAll();
    },
    reloadUsers: userAdmin.reload,
    reloadMetrics: staticData.reloadMetrics,
    reloadCategories: staticData.reloadCategories,
    reloadTags: staticData.reloadTags,
    reloadBooks: staticData.reloadBooks,
    reloadCollections: staticData.reloadCollections,
    reloadBadges: staticData.reloadBadges,
    setBusyKey,
    categoryForm,
    setCategoryForm,
    tagForm,
    setTagForm,
    collectionForm,
    setCollectionForm,
    bookForm,
    setBookForm,
    badgeForm,
    setBadgeForm,
    userForm,
    setUserForm,
    uploadBookId: staticData.uploadBookId,
    coverBookId: staticData.coverBookId,
    coverBookUrl: staticData.coverBookUrl,
    setUploadBookId: staticData.setUploadBookId,
    setCoverBookId: staticData.setCoverBookId,
    setCoverBookUrl: staticData.setCoverBookUrl,
    uploadFile,
    setUploadFile,
    createBookFile,
    setCreateBookFile,
    importQuery,
    importPages,
    importPageSize,
    importReadableOnly,
    importTargetCount,
    importLanguage,
    setImportResult,
    setImportProvider,
    emptyCategory: EMPTY_CATEGORY,
    emptyTag: EMPTY_TAG,
    emptyCollection: EMPTY_COLLECTION,
    emptyBook: EMPTY_BOOK,
    emptyBadge: EMPTY_BADGE,
    emptyUser: EMPTY_USER,
  });

  return (
    <section className="admin-page">
      <AdminHeroPanel metrics={staticData.metrics} error={staticData.error} />

      <nav className="admin-quick-nav" aria-label="Atalhos do painel administrativo">
        <NavLink to="/admin/catalog" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <LibraryBig aria-hidden="true" />
          Gestão de livros
        </NavLink>
        <NavLink to="/admin/engagement" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <Sparkles aria-hidden="true" />
          Conquistas e engajamento
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <UsersRound aria-hidden="true" />
          Gestão de usuários
        </NavLink>
        <NavLink to="/admin/alerts" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <Bell aria-hidden="true" />
          Histórico de ações
        </NavLink>
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : undefined)}>
          <Gauge aria-hidden="true" />
          Dashboard
        </NavLink>
      </nav>

      {visibleSections.includes("catalog") && (
      <AdminCatalogSection
        bookForm={bookForm}
        books={staticData.books}
        categories={staticData.categories}
        tagForm={tagForm}
        tags={staticData.tags}
        categoryForm={categoryForm}
        collectionForm={collectionForm}
        collections={staticData.collections}
        busyKey={busyKey}
        uploadBookId={staticData.uploadBookId}
        uploadFile={uploadFile}
        createBookFile={createBookFile}
        coverBookId={staticData.coverBookId}
        coverBookUrl={staticData.coverBookUrl}
        importQuery={importQuery}
        importPages={importPages}
        importPageSize={importPageSize}
        importReadableOnly={importReadableOnly}
        importTargetCount={importTargetCount}
        importLanguage={importLanguage}
        importResult={importResult}
        importProvider={importProvider}
        onSubmitBook={actions.submitBook}
        onSubmitUpload={actions.uploadPdf}
        onSubmitCover={actions.updateCover}
        onSubmitImport={actions.importBooks}
        onSubmitGutenbergImport={actions.importGutenbergBooks}
        onBookFormChange={setBookForm}
        onResetBook={() => {
          setBookForm(EMPTY_BOOK);
          setCreateBookFile(null);
        }}
        onEditBook={(book) => {
          setCreateBookFile(null);
          actions.fillBookFormFromBook(book);
        }}
        onDeleteBook={(bookId) =>
          void actions.removeItem(
            `book-delete-${bookId}`,
            `/api/admin/books/${bookId}`,
            "Livro removido com sucesso.",
            "Não foi possível remover o livro.",
            async () => {
              await Promise.all([staticData.reloadBooks(), staticData.reloadMetrics()]);
            }
          )
        }
        onUploadBookChange={staticData.setUploadBookId}
        onCoverBookChange={staticData.setCoverBookId}
        onCoverUrlChange={staticData.setCoverBookUrl}
        onUploadFileChange={setUploadFile}
        onCreateBookFileChange={setCreateBookFile}
        onImportQueryChange={setImportQuery}
        onImportPagesChange={setImportPages}
        onImportPageSizeChange={setImportPageSize}
        onImportReadableOnlyChange={setImportReadableOnly}
        onImportTargetCountChange={setImportTargetCount}
        onImportLanguageChange={setImportLanguage}
        onSubmitCategory={actions.submitCategory}
        onCategoryFormChange={setCategoryForm}
        onEditCategory={actions.fillCategoryFormFromCategory}
        onResetCategory={() => setCategoryForm(EMPTY_CATEGORY)}
        onDeleteCategory={(categoryId) =>
          void actions.removeItem(
            `category-delete-${categoryId}`,
            `/api/admin/categories/${categoryId}`,
            "Categoria removida com sucesso.",
            "Não foi possível remover a categoria.",
            async () => {
              await Promise.all([staticData.reloadCategories(), staticData.reloadMetrics()]);
            }
          )
        }
        onSubmitTag={actions.submitTag}
        onTagFormChange={setTagForm}
        onEditTag={actions.fillTagFormFromTag}
        onResetTag={() => setTagForm(EMPTY_TAG)}
        onDeleteTag={(tagId) =>
          void actions.removeItem(
            `tag-delete-${tagId}`,
            `/api/admin/tags/${tagId}`,
            "Tag removida com sucesso.",
            "Não foi possível remover a tag.",
            async () => {
              await Promise.all([staticData.reloadTags(), staticData.reloadMetrics()]);
            }
          )
        }
        onSubmitCollection={actions.submitCollection}
        onCollectionFormChange={setCollectionForm}
        onEditCollection={actions.fillCollectionFormFromCollection}
        onResetCollection={() => setCollectionForm(EMPTY_COLLECTION)}
        onDeleteCollection={(collectionId) =>
          void actions.removeItem(
            `collection-delete-${collectionId}`,
            `/api/admin/collections/${collectionId}`,
            "Coleção removida com sucesso.",
            "Não foi possível remover a coleção.",
            async () => {
              await Promise.all([staticData.reloadCollections(), staticData.reloadMetrics()]);
            }
          )
        }
      />
      )}

      {visibleSections.includes("engagement") && (
      <AdminEngagementSection
        form={badgeForm}
        badges={staticData.badges}
        favorites={staticData.favorites}
        busyKey={busyKey}
        onSubmit={actions.submitBadge}
        onFormChange={setBadgeForm}
        onEdit={actions.fillBadgeFormFromBadge}
        onReset={() => setBadgeForm(EMPTY_BADGE)}
        onDelete={(badgeId) =>
          void actions.removeItem(
            `badge-delete-${badgeId}`,
            `/api/admin/badges/${badgeId}`,
            "Conquista removida com sucesso.",
            "Não foi possível remover a conquista.",
            async () => {
              await Promise.all([staticData.reloadBadges(), staticData.reloadMetrics()]);
            }
          )
        }
      />
      )}

      {visibleSections.includes("users") && (
      <AdminUsersSection
          form={userForm}
          users={userAdmin.users}
          totalUsers={userAdmin.totalUsers}
          currentPage={userAdmin.page}
          totalPages={userAdmin.totalPages}
          search={userAdmin.search}
          activeFilter={userAdmin.activeFilter}
          roleFilter={userAdmin.roleFilter}
          loading={userAdmin.loading}
          currentUserEmail={auth?.email ?? ""}
          busyKey={busyKey}
          onSubmit={actions.submitUser}
          onFormChange={setUserForm}
          onEdit={actions.fillUserFormFromUser}
          onReset={() => setUserForm(EMPTY_USER)}
          onInvalidate={(userId) =>
            void actions.removeItem(`user-invalidate-${userId}`, `/api/admin/users/${userId}`, "Usuário invalidado com sucesso.", "Não foi possível invalidar o usuário.", userAdmin.reload)
          }
          onReactivate={(userId) => void actions.reactivateUser(userId)}
          onSearchChange={userAdmin.setSearch}
          onActiveFilterChange={userAdmin.setActiveFilter}
          onRoleFilterChange={userAdmin.setRoleFilter}
          onPageChange={userAdmin.setPage}
        />
      )}

      {visibleSections.includes("alerts") && (
      <AdminAlertsSection
        deliveries={alertAdmin.deliveries}
        totalDeliveries={alertAdmin.totalDeliveries}
        currentPage={alertAdmin.page}
        totalPages={alertAdmin.totalPages}
        search={alertAdmin.search}
        statusFilter={alertAdmin.statusFilter}
        alertTypeFilter={alertAdmin.alertTypeFilter}
        loading={alertAdmin.loading}
        onSearchChange={alertAdmin.setSearch}
        onStatusFilterChange={alertAdmin.setStatusFilter}
        onAlertTypeFilterChange={alertAdmin.setAlertTypeFilter}
        onPageChange={alertAdmin.setPage}
      />
      )}
    </section>
  );
}
