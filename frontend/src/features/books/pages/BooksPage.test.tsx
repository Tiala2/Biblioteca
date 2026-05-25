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

  it("deve carregar livros e mostrar selo Open Library para livro externo sem pdf", async () => {
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
          { id: "1", title: "Livro A", numberOfPages: 120, hasPdf: false, hasNarrative: true, source: "OPEN", coverUrl: null },
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
    expect(screen.getByRole("heading", { name: "Resumo da vitrine" })).toBeInTheDocument();
    expect(screen.getByText("livros nesta página")).toBeInTheDocument();
    expect(screen.getByText("com PDF")).toBeInTheDocument();
    expect(screen.getAllByText("Open Library").length).toBeGreaterThan(0);
    expect(screen.getByText("com dinâmica")).toBeInTheDocument();
    expect(screen.getByText("catálogo local")).toBeInTheDocument();
    expect(screen.getByText("favoritos")).toBeInTheDocument();
    expect(screen.getByText("média de páginas")).toBeInTheDocument();
    expect(screen.getByText(/Total visível:/)).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
    expect(screen.getAllByText("Open Library").length).toBeGreaterThan(0);
    expect(screen.getByText("Dinâmica")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Livro B" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ler agora" })).toHaveLength(2);
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

    const input = await screen.findByPlaceholderText(/Pesquisar por título/i);
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

    await screen.findByPlaceholderText(/Pesquisar por título/i);

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

  it("deve mostrar filtros aplicados e permitir remover um filtro", async () => {
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
        content: [{ id: "1", title: "Livro A", numberOfPages: 120, hasPdf: true, source: "LOCAL", coverUrl: null }],
        page: { size: 12, number: 0, totalElements: 1, totalPages: 1 },
      },
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: [],
    } as never);
    mockedGet.mockResolvedValue({
      data: {
        content: [],
        page: { size: 12, number: 0, totalElements: 0, totalPages: 0 },
      },
    } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/books?q=Hobbit&withPdf=1&sort=NEW_RELEASES"]}>
        <Routes>
          <Route path="/books" element={<BooksPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Busca: Hobbit")).toBeInTheDocument();
    expect(screen.getByText("Somente com PDF")).toBeInTheDocument();
    expect(screen.getByText("Ordem: Lançamentos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover filtro Busca: Hobbit" }));

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        "/api/v1/books",
        expect.objectContaining({
          params: expect.objectContaining({
            q: undefined,
            includeWithoutPdf: false,
            sort: "NEW_RELEASES",
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

    expect(await screen.findByRole("heading", { name: "Não foi possível carregar o catálogo" })).toBeInTheDocument();
    expect(screen.getByText("Não foi possível conversar com o servidor. Verifique se o backend está ativo.")).toBeInTheDocument();
  });
});
