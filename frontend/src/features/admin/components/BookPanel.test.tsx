import { render, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { BookPanel } from "./BookPanel";
import type { BookForm, ImportResult } from "../types";

const EMPTY_FORM: BookForm = {
  id: null,
  title: "",
  author: "",
  isbn: "",
  numberOfPages: 150,
  publicationDate: "2020-01-01",
  coverUrl: "",
  categoryIds: [],
};

function renderPanel(importResult: ImportResult | null) {
  const noopAsync = vi.fn(async (event: FormEvent) => {
    event.preventDefault();
  });

  render(
    <BookPanel
      form={EMPTY_FORM}
      books={[]}
      categories={[]}
      busyKey={null}
      uploadBookId=""
      uploadFile={null}
      coverBookId=""
      coverBookUrl=""
      importQuery="subject:fiction"
      importPages={10}
      importPageSize={100}
      importReadableOnly
      importTargetCount={100}
      importResult={importResult}
      onSubmitBook={noopAsync}
      onSubmitUpload={noopAsync}
      onSubmitCover={noopAsync}
      onSubmitImport={noopAsync}
      onFormChange={vi.fn()}
      onReset={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onUploadBookChange={vi.fn()}
      onCoverBookChange={vi.fn()}
      onCoverUrlChange={vi.fn()}
      onUploadFileChange={vi.fn()}
      onImportQueryChange={vi.fn()}
      onImportPagesChange={vi.fn()}
      onImportPageSizeChange={vi.fn()}
      onImportReadableOnlyChange={vi.fn()}
      onImportTargetCountChange={vi.fn()}
    />
  );
}

describe("BookPanel", () => {
  it("deve mostrar resumo humano para importacao parcial da Open Library", () => {
    renderPanel({
      fetched: 100,
      imported: 80,
      skipped: 5,
      failed: 1,
      messages: ["Failed fetching Open Library page 2: Failed to call Open Library API"],
    });

    expect(screen.getByRole("heading", { name: "Importação parcial" })).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("importados")).toBeInTheDocument();
    expect(screen.getByText("Failed fetching Open Library page 2: Failed to call Open Library API")).toBeInTheDocument();
  });
});
