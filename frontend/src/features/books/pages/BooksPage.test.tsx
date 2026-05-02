import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar livros e mostrar selo OPEN LIBRARY para livro externo sem pdf", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockResolvedValueOnce({
      data: [
        { id: "cat-1", name: "Fantasia" },
      ],
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: [
        { id: "tag-1", name: "Aventura" },
      ],
    } as never);
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
      data: [
        { id: "cat-1", name: "Fantasia" },
      ],
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: [
        { id: "tag-1", name: "Aventura" },
      ],
    } as never);
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

  it("deve enviar filtros de categoria e tag para o backend", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet.mockResolvedValueOnce({
      data: [
        { id: "cat-1", name: "Fantasia" },
        { id: "cat-2", name: "Drama" },
      ],
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: [
        { id: "tag-1", name: "Aventura" },
        { id: "tag-2", name: "Classico" },
      ],
    } as never);
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

    await screen.findByPlaceholderText(/Pesquisar por titulo/i);

    await user.selectOptions(screen.getByLabelText("Filtrar por categoria"), "cat-1");
    await user.selectOptions(screen.getByLabelText("Filtrar por tag"), "tag-2");
    await user.click(screen.getByRole("button", { name: "Pesquisar" }));

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        "/api/v1/books",
        expect.objectContaining({
          params: expect.objectContaining({
            categoryIds: "cat-1",
            tagIds: "tag-2",
          }),
        })
      )
    );
  });

  it("deve exibir erro amigavel quando a API do catalogo estiver indisponivel", async () => {
    const mockedGet = vi.mocked(api.get);
    mockedGet
      .mockResolvedValueOnce({ data: [] } as never)
      .mockResolvedValueOnce({ data: [] } as never)
      .mockRejectedValueOnce(new AxiosError("Network Error") as never)
      .mockResolvedValue({ data: [] } as never);

    render(
      <MemoryRouter initialEntries={["/books"]}>
        <Routes>
          <Route path="/books" element={<BooksPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Falha ao carregar catalogo" })).toBeInTheDocument();
    expect(screen.getByText("Falha de conexao com o servidor.")).toBeInTheDocument();
  });
});
