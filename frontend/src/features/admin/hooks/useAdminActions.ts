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
  ImportProvider,
  ImportResult,
  Tag,
  TagForm,
  UserAdmin,
  UserForm,
} from "../types";

type UseAdminActionsParams = {
  headers?: Record<string, string>;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  reloadAll: () => Promise<void>;
  reloadUsers: () => Promise<void>;
  reloadMetrics: () => Promise<void>;
  reloadCategories: () => Promise<void>;
  reloadTags: () => Promise<void>;
  reloadBooks: () => Promise<void>;
  reloadCollections: () => Promise<void>;
  reloadBadges: () => Promise<void>;
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
  setUploadBookId: (value: string) => void;
  setCoverBookId: (value: string) => void;
  setCoverBookUrl: (value: string) => void;
  uploadFile: File | null;
  setUploadFile: Dispatch<SetStateAction<File | null>>;
  createBookFile: File | null;
  setCreateBookFile: Dispatch<SetStateAction<File | null>>;
  importQuery: string;
  importPages: number;
  importPageSize: number;
  importReadableOnly: boolean;
  importTargetCount: number;
  importLanguage: "pt" | "en";
  setImportResult: Dispatch<SetStateAction<ImportResult | null>>;
  setImportProvider: Dispatch<SetStateAction<ImportProvider>>;
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
  reloadUsers,
  reloadMetrics,
  reloadCategories,
  reloadTags,
  reloadBooks,
  reloadCollections,
  reloadBadges,
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
  setUploadBookId,
  setCoverBookId,
  setCoverBookUrl,
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
  emptyCategory,
  emptyTag,
  emptyCollection,
  emptyBook,
  emptyBadge,
  emptyUser,
}: UseAdminActionsParams) {
  const reloadBooksAndMetrics = async () => {
    await Promise.all([reloadBooks(), reloadMetrics()]);
  };

  const runAction = async <T = unknown>(
    key: string,
    action: () => Promise<T>,
    successMessage: string,
    errorMessage: string,
    reload: () => Promise<void> = reloadAll
  ) => {
    setBusyKey(key);
    try {
      const result = await action();
      showToast(successMessage, "success");
      try {
        await reload();
      } catch {
        showToast("A ação foi concluída, mas a atualização da tela demorou. Recarregue se necessário.", "info");
      }
      return result;
    } catch {
      showToast(errorMessage, "error");
      return undefined;
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
      categoryForm.id ? "Não foi possível atualizar a categoria." : "Não foi possível criar a categoria.",
      async () => {
        await Promise.all([reloadCategories(), reloadMetrics()]);
      }
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
      tagForm.id ? "Não foi possível atualizar a tag." : "Não foi possível criar a tag.",
      async () => {
        await Promise.all([reloadTags(), reloadMetrics()]);
      }
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
      collectionForm.id ? "Coleção atualizada com sucesso." : "Coleção criada com sucesso.",
      collectionForm.id ? "Não foi possível atualizar a coleção." : "Não foi possível criar a coleção.",
      async () => {
        await Promise.all([reloadCollections(), reloadMetrics()]);
      }
    );
    setCollectionForm(emptyCollection);
  };

  const submitBook = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !bookForm.title.trim() || !bookForm.isbn.trim()) return;
    if (!bookForm.id) {
      if (!createBookFile) {
        showToast("Selecione um PDF para criar o livro com leitura interna.", "error");
        return;
      }

      setBusyKey("book-create");
      let createdBook: Book | undefined;
      try {
        const createResponse = await api.post(
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
        );
        createdBook = createResponse.data as Book;

        const formData = new FormData();
        formData.append("file", createBookFile);
        await api.post(`/api/admin/books/${createdBook.id}/upload`, formData, { headers });

        setUploadBookId(createdBook.id);
        setCoverBookId(createdBook.id);
        setCoverBookUrl(createdBook.coverUrl ?? "");
        setBookForm(emptyBook);
        setCreateBookFile(null);
        showToast("Livro criado com PDF de leitura interna.", "success");
        try {
          await reloadBooksAndMetrics();
        } catch {
          showToast("O livro foi criado, mas a atualização da lista demorou. Recarregue se necessário.", "info");
        }
      } catch {
        if (createdBook?.id) {
          try {
            await api.delete(`/api/admin/books/${createdBook.id}`, { headers });
          } catch {
            // Se a limpeza falhar, a recarga mostra o estado real para o admin.
          }
        }
        try {
          await reloadBooksAndMetrics();
        } catch {
          // A mensagem principal já informa a falha do cadastro.
        }
        showToast("Não foi possível criar o livro com PDF. O cadastro exige arquivo de leitura válido.", "error");
      } finally {
        setBusyKey(null);
      }
      return;
    }
    const response = await runAction(
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
      bookForm.id ? "Não foi possível atualizar o livro." : "Não foi possível criar o livro.",
      reloadBooksAndMetrics
    );
    const savedBook = response?.data as Book | undefined;
    if (savedBook?.id) {
      setUploadBookId(savedBook.id);
      setCoverBookId(savedBook.id);
      setCoverBookUrl(savedBook.coverUrl ?? "");
    }
    setBookForm(emptyBook);
  };

  const submitBadge = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !badgeForm.name.trim()) return;
    await runAction(
      badgeForm.id ? `badge-save-${badgeForm.id}` : "badge-create",
      () => (badgeForm.id ? api.put(`/api/admin/badges/${badgeForm.id}`, badgeForm, { headers }) : api.post("/api/admin/badges", badgeForm, { headers })),
      badgeForm.id ? "Conquista atualizada com sucesso." : "Conquista criada com sucesso.",
      badgeForm.id ? "Não foi possível atualizar a conquista." : "Não foi possível criar a conquista.",
      async () => {
        await Promise.all([reloadBadges(), reloadMetrics()]);
      }
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
      "Usuário atualizado com sucesso.",
      "Não foi possível atualizar o usuário.",
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
      "Usuário reativado com sucesso.",
      "Não foi possível reativar o usuário.",
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
      () => api.post(`/api/admin/books/${uploadBookId}/upload`, formData, { headers }),
      "PDF enviado com sucesso.",
      "Não foi possível enviar o arquivo do livro.",
      reloadBooksAndMetrics
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
      "Não foi possível atualizar a capa do livro.",
      reloadBooksAndMetrics
    );
  };

  const importBooks = async (event: FormEvent) => {
    event.preventDefault();
    if (!headers || !importQuery.trim()) return;
    setBusyKey("book-import");
    try {
      setImportProvider("open-library");
      const response = await api.post<ImportResult>(
        "/api/admin/books/import/open-library",
        {
          query: importQuery,
          pages: Number(importPages),
          pageSize: Number(importPageSize),
          readableOnly: importReadableOnly,
          targetImportCount: Number(importTargetCount),
          language: importLanguage,
        },
        { headers }
      );
      setImportResult(response.data);
      await reloadBooksAndMetrics();
      if (response.data.imported > 0 && response.data.failed > 0) {
        showToast("Importação parcial: alguns livros entraram, mas a Open Library falhou em parte da busca.", "info");
      } else if (response.data.failed > 0) {
        showToast("A Open Library não respondeu como esperado. Tente novamente em instantes.", "error");
      } else {
        showToast("Importação concluída com sucesso.", "success");
      }
    } catch {
      showToast("Não foi possível importar livros da Open Library.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const importGutenbergBooks = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!headers) return;
    setBusyKey("book-import-gutenberg");
    try {
      setImportProvider("gutenberg");
      const response = await api.post<ImportResult>(
        "/api/admin/books/import/gutenberg",
        {
          query: importQuery.trim() || "fiction",
          pages: Number(importPages),
          pageSize: Number(importPageSize),
          readableOnly: true,
          targetImportCount: Number(importTargetCount),
          language: importLanguage,
        },
        { headers }
      );
      setImportResult(response.data);
      await reloadBooksAndMetrics();
      if (response.data.imported > 0 && response.data.failed > 0) {
        showToast("Alguns clássicos entraram com leitura interna, mas parte da curadoria falhou.", "info");
      } else if (response.data.failed > 0) {
        showToast("Não foi possível importar os clássicos do Project Gutenberg agora.", "error");
      } else {
        showToast("Clássicos importados com leitura interna.", "success");
      }
    } catch {
      showToast("Não foi possível importar clássicos do Project Gutenberg.", "error");
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
    importGutenbergBooks,
    fillBookFormFromBook,
    fillCategoryFormFromCategory,
    fillTagFormFromTag,
    fillCollectionFormFromCollection,
    fillBadgeFormFromBadge,
    fillUserFormFromUser,
  };
}
