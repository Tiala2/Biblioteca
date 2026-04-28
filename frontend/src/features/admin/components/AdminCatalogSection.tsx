import type { FormEvent } from "react";
import { AdminSection } from "./AdminSection";
import { BookPanel } from "./BookPanel";
import { CategoryPanel } from "./CategoryPanel";
import { CollectionPanel } from "./CollectionPanel";
import { TagPanel } from "./TagPanel";
import type {
  Book,
  BookForm,
  Category,
  CategoryForm,
  Collection,
  CollectionForm,
  ImportResult,
  Tag,
  TagForm,
} from "../types";

type AdminCatalogSectionProps = {
  bookForm: BookForm;
  books: Book[];
  categories: Category[];
  tagForm: TagForm;
  tags: Tag[];
  categoryForm: CategoryForm;
  collectionForm: CollectionForm;
  collections: Collection[];
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
  onBookFormChange: (updater: (previous: BookForm) => BookForm) => void;
  onResetBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onUploadBookChange: (bookId: string) => void;
  onCoverBookChange: (bookId: string) => void;
  onCoverUrlChange: (value: string) => void;
  onUploadFileChange: (file: File | null) => void;
  onImportQueryChange: (value: string) => void;
  onImportPagesChange: (value: number) => void;
  onImportPageSizeChange: (value: number) => void;
  onSubmitCategory: (event: FormEvent) => Promise<void>;
  onCategoryFormChange: (updater: (previous: CategoryForm) => CategoryForm) => void;
  onEditCategory: (category: Category) => void;
  onResetCategory: () => void;
  onDeleteCategory: (categoryId: string) => void;
  onSubmitTag: (event: FormEvent) => Promise<void>;
  onTagFormChange: (updater: (previous: TagForm) => TagForm) => void;
  onEditTag: (tag: Tag) => void;
  onResetTag: () => void;
  onDeleteTag: (tagId: string) => void;
  onSubmitCollection: (event: FormEvent) => Promise<void>;
  onCollectionFormChange: (updater: (previous: CollectionForm) => CollectionForm) => void;
  onEditCollection: (collection: Collection) => void;
  onResetCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
};

export function AdminCatalogSection({
  bookForm,
  books,
  categories,
  tagForm,
  tags,
  categoryForm,
  collectionForm,
  collections,
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
  onBookFormChange,
  onResetBook,
  onEditBook,
  onDeleteBook,
  onUploadBookChange,
  onCoverBookChange,
  onCoverUrlChange,
  onUploadFileChange,
  onImportQueryChange,
  onImportPagesChange,
  onImportPageSizeChange,
  onSubmitCategory,
  onCategoryFormChange,
  onEditCategory,
  onResetCategory,
  onDeleteCategory,
  onSubmitTag,
  onTagFormChange,
  onEditTag,
  onResetTag,
  onDeleteTag,
  onSubmitCollection,
  onCollectionFormChange,
  onEditCollection,
  onResetCollection,
  onDeleteCollection,
}: AdminCatalogSectionProps) {
  return (
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
        onSubmitBook={onSubmitBook}
        onSubmitUpload={onSubmitUpload}
        onSubmitCover={onSubmitCover}
        onSubmitImport={onSubmitImport}
        onFormChange={onBookFormChange}
        onReset={onResetBook}
        onEdit={onEditBook}
        onDelete={onDeleteBook}
        onUploadBookChange={onUploadBookChange}
        onCoverBookChange={onCoverBookChange}
        onCoverUrlChange={onCoverUrlChange}
        onUploadFileChange={onUploadFileChange}
        onImportQueryChange={onImportQueryChange}
        onImportPagesChange={onImportPagesChange}
        onImportPageSizeChange={onImportPageSizeChange}
      />

      <CategoryPanel
        form={categoryForm}
        categories={categories}
        busyKey={busyKey}
        onSubmit={onSubmitCategory}
        onFormChange={onCategoryFormChange}
        onEdit={onEditCategory}
        onReset={onResetCategory}
        onDelete={onDeleteCategory}
      />

      <TagPanel
        form={tagForm}
        tags={tags}
        busyKey={busyKey}
        onSubmit={onSubmitTag}
        onFormChange={onTagFormChange}
        onEdit={onEditTag}
        onReset={onResetTag}
        onDelete={onDeleteTag}
      />

      <CollectionPanel
        form={collectionForm}
        collections={collections}
        books={books}
        busyKey={busyKey}
        onSubmit={onSubmitCollection}
        onFormChange={onCollectionFormChange}
        onEdit={onEditCollection}
        onReset={onResetCollection}
        onDelete={onDeleteCollection}
      />
    </AdminSection>
  );
}
