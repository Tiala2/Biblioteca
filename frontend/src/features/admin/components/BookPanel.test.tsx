import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { BookPanel } from "./BookPanel";
import type { Book, BookForm, ImportResult } from "../types";

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

function renderPanel(importResult: ImportResult | null, options?: { books?: Book[]; uploadBookId?: string }) {
  const noopAsync = vi.fn(async (event: FormEvent) => {
    event.preventDefault();
  });
  const onUploadBookChange = vi.fn();

  render(
    <BookPanel
      form={EMPTY_FORM}
      books={options?.books ?? []}
      categories={[]}
      busyKey={null}
      uploadBookId={options?.uploadBookId ?? ""}
      uploadFile={null}
      createBookFile={null}
      coverBookId=""
      coverBookUrl=""
      importQuery="subject:fiction"
      importPages={10}
      importPageSize={100}
      importReadableOnly
      importTargetCount={100}
      importLanguage="pt"
      importResult={importResult}
      importProvider="open-library"
      onSubmitBook={noopAsync}
      onSubmitUpload={noopAsync}
      onSubmitCover={noopAsync}
      onSubmitImport={noopAsync}
      onSubmitGutenbergImport={vi.fn(async () => undefined)}
      onFormChange={vi.fn()}
      onReset={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onUploadBookChange={onUploadBookChange}
      onCoverBookChange={vi.fn()}
      onCoverUrlChange={vi.fn()}
      onUploadFileChange={vi.fn()}
      onCreateBookFileChange={vi.fn()}
      onImportQueryChange={vi.fn()}
      onImportPagesChange={vi.fn()}
      onImportPageSizeChange={vi.fn()}
      onImportReadableOnlyChange={vi.fn()}
      onImportTargetCountChange={vi.fn()}
      onImportLanguageChange={vi.fn()}
    />
  );

  return { onUploadBookChange };
}

describe("BookPanel", () => {
  it("deve mostrar resumo humano para importacao parcial da Open Library", () => {
    renderPanel({
      fetched: 100,
      imported: 80,
      skipped: 5,
      failed: 1,
      messages: ["Não foi possível consultar a página 2 da Open Library. Tente novamente em instantes."],
    });

    expect(screen.getByRole("heading", { name: "Importação parcial" })).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("importados")).toBeInTheDocument();
    expect(screen.getByText("Não foi possível consultar a página 2 da Open Library. Tente novamente em instantes.")).toBeInTheDocument();
  });

  it("deve indicar origem e modo de leitura dos livros no painel administrativo", () => {
    renderPanel(null, {
      books: [
        {
          id: "book-1",
          title: "Livro com PDF",
          author: "Autora",
          isbn: "123",
          hasPdf: true,
          source: "LOCAL",
        },
        {
          id: "book-2",
          title: "Livro externo",
          author: "Autor",
          isbn: "456",
          hasPdf: false,
          source: "OPEN",
        },
      ],
      uploadBookId: "book-1",
    });

    expect(screen.getAllByText("Acervo interno").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leitura integrada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Open Library").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Atualização manual").length).toBeGreaterThan(0);
    expect(screen.getByText("Substitui arquivo atual")).toBeInTheDocument();
  });

  it("deve permitir pesquisar e selecionar livro existente para anexar PDF", async () => {
    const user = userEvent.setup();
    const { onUploadBookChange } = renderPanel(null, {
      books: [
        {
          id: "book-1",
          title: "A Guerra dos Tronos",
          author: "George R. R. Martin",
          isbn: "111",
          hasPdf: false,
          source: "LOCAL",
        },
        {
          id: "book-2",
          title: "Dom Casmurro",
          author: "Machado de Assis",
          isbn: "222",
          hasPdf: true,
          source: "LOCAL",
        },
      ],
      uploadBookId: "book-1",
    });

    const search = screen.getByLabelText("Buscar livro para enviar arquivo de leitura");
    await user.clear(search);
    await user.type(search, "casmurro");
    const uploadPicker = screen.getByLabelText("Livros existentes para anexar arquivo de leitura");
    await user.click(within(uploadPicker).getByRole("button", { name: /Dom Casmurro/i }));

    expect(onUploadBookChange).toHaveBeenCalledWith("book-2");
  });
});
