import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BooksPage } from "./BooksPage";

vi.mock("@features/auth/context/AuthContext", () => {
  return {
    useAuth: () => ({
      auth: {
        token: "test-token",
        name: "Teste",
      },
    }),
  };
});

vi.mock("@shared/ui/toast/ToastContext", () => {
  return {
    useToast: () => ({
      showToast: vi.fn(),
    }),
  };
});

vi.mock("@shared/api/http", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import { api } from "@shared/api/http";

describe("BooksPage", () => {
  it("deve carregar livros e mostrar selo OPEN LIBRARY para livro externo sem pdf", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [
          { id: "1", title: "Livro A", numberOfPages: 120, hasPdf: false, source: "OPEN", coverUrl: null },
          { id: "2", title: "Livro B", numberOfPages: 200, hasPdf: true, source: "LOCAL", coverUrl: null },
        ],
        page: { size: 12, number: 0, totalElements: 2, totalPages: 1 },
      },
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: [],
    } as never);

    render(
      <MemoryRouter initialEntries={["/books"]}>
        <Routes>
          <Route path="/books" element={<BooksPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Livro A" })).toBeInTheDocument();
    expect(screen.getByText("OPEN LIBRARY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Livro B" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ler no app" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Ler com progresso" })).toBeInTheDocument();
  });

  it("deve atualizar busca ao clicar em pesquisar", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockResolvedValueOnce({
      data: {
        content: [],
        page: { size: 12, number: 0, totalElements: 0, totalPages: 0 },
      },
    } as never);
    mockedGet.mockResolvedValue({
      data: [],
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
