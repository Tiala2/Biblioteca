import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BooksPage } from "./BooksPage";

vi.mock("@shared/api/http", () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

import { api } from "@shared/api/http";

describe("BooksPage", () => {
  it("deve carregar livros e mostrar selo IMPORTADO para livro sem pdf", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [
          { id: "1", title: "Livro A", numberOfPages: 120, hasPdf: false },
          { id: "2", title: "Livro B", numberOfPages: 200, hasPdf: true },
        ],
        page: { size: 12, number: 0, totalElements: 2, totalPages: 1 },
      },
    } as never);

    render(
      <MemoryRouter initialEntries={["/books"]}>
        <Routes>
          <Route path="/books" element={<BooksPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Livro A")).toBeInTheDocument();
    expect(screen.getByText("IMPORTADO")).toBeInTheDocument();
    expect(screen.getByText("Livro B")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ler no app" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Abrir detalhes" })).toBeInTheDocument();
  });

  it("deve atualizar busca ao clicar em pesquisar", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockResolvedValue({
      data: {
        content: [],
        page: { size: 12, number: 0, totalElements: 0, totalPages: 0 },
      },
    } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/books"]}>
        <Routes>
          <Route path="/books" element={<BooksPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = await screen.findByPlaceholderText(/Pesquisar por titulo/i);
    await user.type(input, "Hobbit");
    await user.click(screen.getByRole("button", { name: "Pesquisar" }));

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
  });
});
