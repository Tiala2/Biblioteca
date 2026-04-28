import type { Dispatch, FormEvent, SetStateAction } from "react";
import { api } from "@shared/api/http";
import type {
  BadgeForm,
  Book,
  BookForm,
  Category,
  CategoryForm,
  Collection,
  CollectionForm,
  ImportResult,
  Tag,
  TagForm,
  UserAdmin,
  UserForm,
} from "../types";

type UseAdminActionsParams = {
  headers?: Record<string, string>;
  showToast: (message: string, type: "success" | "error") => void;
  reloadAll: () => Promise<void>;
  reloadStaticData: () => Promise<void>;
  reloadUsers: () => Promise<void>;
  setBusyKey: Dispatch<SetStateAction<string | null>>;
  categoryForm: CategoryForm;
  setCategoryForm: Dispatch<SetStateAction<CategoryForm>>;
  tagForm: TagForm;
  setTagForm: Dispatch<SetStateAction<TagForm>>;
  collectionForm: CollectionForm;
  setCollectionForm: Dispatch<SetStateAction<CollectionForm>>;
  bookForm: BookForm;
  setBookForm: Dispatch<SetStateAction<BookForm>>;
  badgeForm: BadgeForm;
  setBadgeForm: Dispatch<SetStateAction<BadgeForm>>;
  userForm: UserForm;
  setUserForm: Dispatch<SetStateAction<UserForm>>;
  uploadBookId: string;
  coverBookId: string;
  coverBookUrl: string;
  uploadFile: File | null;
  setUploadFile: Dispatch<SetStateAction<File | null>>;
  importQuery: string;
  importPages: number;
  importPageSize: number;
  setImportResult: Dispatch<SetStateAction<ImportResult | null>>;
  emptyCategory: CategoryForm;
  emptyTag: TagForm;
  emptyCollection: CollectionForm;
  emptyBook: BookForm;
  emptyBadge: BadgeForm;
  emptyUser: UserForm;
};

export function useAdminActions({
  headers,
  showToast,
  reloadAll,
  reloadStaticData,
  reloadUsers,
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
  uploadBookId,
  coverBookId,
  coverBookUrl,
  uploadFile,
  setUploadFile,
  importQuery,
  importPages,
  importPageSize,
  setImportResult,
  emptyCategory,
  emptyTag,
  emptyCollection,
  emptyBook,
  emptyBadge,
  emptyUser,
}: UseAdminActionsParams) {
  const runAction = async (
    key: string,
    action: () => Promise<unknown>,
    successMessage: string,
    errorMessage: string,
    reload: () => Promise<void> = reloadAll
  ) => {
    setBusyKey(key);
    try {
      await action();
      await reload();
      showToast(successMessage, "success");
    } catch {
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
    setCategoryForm(emptyCategory);
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
    setTagForm(emptyTag);
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
    setCollectionForm(emptyCollection);
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
    setBookForm(emptyBook);
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
    setBadgeForm(emptyBadge);
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
            role: userForm.role,
          },
          { headers }
        ),
      "Usuario atualizado com sucesso.",
      "Falha ao atualizar usuario.",
      reloadUsers
    );
    setUserForm(emptyUser);
  };

  const removeItem = async (key: string, path: string, successMessage: string, errorMessage: string, reload?: () => Promise<void>) => {
    if (!headers) return;
    await runAction(key, () => api.delete(path, { headers }), successMessage, errorMessage, reload);
  };

  const reactivateUser = async (userId: string) => {
    if (!headers) return;
    await runAction(
      `user-reactivate-${userId}`,
      () => api.patch(`/api/admin/users/${userId}/reactivate`, undefined, { headers }),
      "Usuario reativado com sucesso.",
      "Falha ao reativar usuario.",
      reloadUsers
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
      await reloadStaticData();
      showToast("Importacao concluida com sucesso.", "success");
    } catch {
      showToast("Falha ao importar livros da Open Library.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const fillBookFormFromBook = (book: Book) => {
    setBookForm({
      id: book.id,
      title: book.title,
      author: book.author ?? "",
      isbn: book.isbn ?? "",
      numberOfPages: book.numberOfPages ?? 1,
      publicationDate: book.publicationDate ?? "2020-01-01",
      coverUrl: book.coverUrl ?? "",
      categoryIds: book.categories?.map((category) => category.id) ?? [],
    });
  };

  const fillCategoryFormFromCategory = (category: Category) => {
    setCategoryForm({ id: category.id, name: category.name, description: category.description ?? "" });
  };

  const fillTagFormFromTag = (tag: Tag) => {
    setTagForm({ id: tag.id, name: tag.name });
  };

  const fillCollectionFormFromCollection = (collection: Collection) => {
    setCollectionForm({
      id: collection.id,
      title: collection.title,
      description: collection.description ?? "",
      coverUrl: collection.coverUrl ?? "",
      bookIds: collection.books?.map((book) => book.id) ?? [],
    });
  };

  const fillBadgeFormFromBadge = (badge: { id: string; code: BadgeForm["code"]; name: string; description?: string | null; criteriaType: BadgeForm["criteriaType"]; criteriaValue?: string | null; active: boolean; }) => {
    setBadgeForm({
      id: badge.id,
      code: badge.code,
      name: badge.name,
      description: badge.description ?? "",
      criteriaType: badge.criteriaType,
      criteriaValue: badge.criteriaValue ?? "",
      active: badge.active,
    });
  };

  const fillUserFormFromUser = (user: UserAdmin) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      leaderboardOptIn: user.leaderboardOptIn,
      alertsOptIn: user.alertsOptIn,
      role: user.role,
    });
  };

  return {
    submitCategory,
    submitTag,
    submitCollection,
    submitBook,
    submitBadge,
    submitUser,
    removeItem,
    reactivateUser,
    uploadPdf,
    updateCover,
    importBooks,
    fillBookFormFromBook,
    fillCategoryFormFromCategory,
    fillTagFormFromTag,
    fillCollectionFormFromCollection,
    fillBadgeFormFromBadge,
    fillUserFormFromUser,
  };
}
