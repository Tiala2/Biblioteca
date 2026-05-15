import { render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";

vi.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    auth: {
      token: "test-token",
      name: "Leitora Teste",
    },
  }),
}));

vi.mock("@shared/api/http", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("deve carregar resumo, leitura atual e recomendacoes", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        userSummary: {
          totalInProgress: 1,
          totalFinished: 2,
          totalPagesRead: 320,
        },
        readings: [
          {
            id: "reading-1",
            status: "IN_PROGRESS",
            currentPage: 45,
            progress: 30,
            book: {
              id: "book-1",
              title: "Livro Atual",
              coverUrl: null,
              source: "LOCAL",
            },
          },
        ],
        readingProgress: {
          goal: {
            targetPages: 120,
            progressPages: 60,
            progressPercent: 50,
            remainingPages: 60,
            status: "ACTIVE",
          },
          streakDays: 5,
          pagesReadThisWeek: 80,
          sessionsThisWeek: 3,
          lastSessionAt: "2026-04-20T12:00:00",
        },
        collections: [
          {
            id: "collection-1",
            title: "Classicos",
            description: "Leituras essenciais",
            books: [
              { id: "book-1", title: "Livro Atual", isbn: "123", coverUrl: null },
              { id: "book-3", title: "Livro Extra", isbn: "456", coverUrl: null },
            ],
          },
        ],
        recommendations: [
          {
            id: "book-2",
            title: "Livro Recomendado",
            coverUrl: null,
            source: "OPEN",
            favorite: true,
            numberOfPages: 240,
            averageRating: 4.5,
          },
        ],
        recentReviews: [
          {
            bookTitle: "Livro Avaliado",
            rating: 5,
          },
        ],
      },
    } as never);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Bem-vinda, Leitora Teste" })).toBeInTheDocument();
    expect(screen.getAllByText("Livro Atual").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Livro Recomendado").length).toBeGreaterThan(0);
    expect(screen.getByText("locais/PDF")).toBeInTheDocument();
    expect(screen.getByText("Open Library")).toBeInTheDocument();
    expect(screen.getByText("nota média")).toBeInTheDocument();
    expect(screen.getByText("OPEN LIBRARY")).toBeInTheDocument();
    expect(screen.getByText("FAVORITO")).toBeInTheDocument();
    expect(screen.getByText("Nota 4.5 | 240 páginas")).toBeInTheDocument();
    expect(screen.getAllByText("Classicos").length).toBeGreaterThan(0);
    expect(screen.getByText("coleções")).toBeInTheDocument();
    expect(screen.getByText("livros reunidos")).toBeInTheDocument();
    expect(screen.getByText("maior coleção")).toBeInTheDocument();
    expect(screen.getByText("Leituras essenciais")).toBeInTheDocument();
    expect(screen.getByText("Livro Atual | Livro Extra")).toBeInTheDocument();
    expect(screen.getAllByText("Livro Avaliado").length).toBeGreaterThan(0);
  });

  it("deve exibir fallback quando a API estiver indisponivel", async () => {
    vi.mocked(api.get).mockRejectedValue(new AxiosError("Network Error") as never);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Não foi possível carregar o painel" })).toBeInTheDocument();
    expect(screen.getByText("Falha de conexão com o servidor.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o catálogo" })).toBeInTheDocument();
  });
});
