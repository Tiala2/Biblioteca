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
            books: [{ id: "book-1", title: "Livro Atual" }],
          },
        ],
        recommendations: [
          {
            id: "book-2",
            title: "Livro Recomendado",
            coverUrl: null,
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
    expect(screen.getByText("Classicos")).toBeInTheDocument();
    expect(screen.getByText("Livro Avaliado")).toBeInTheDocument();
  });

  it("deve exibir fallback quando a API estiver indisponivel", async () => {
    vi.mocked(api.get).mockRejectedValue(new AxiosError("Network Error") as never);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Nao foi possivel carregar o painel" })).toBeInTheDocument();
    expect(screen.getByText("Falha de conexao com o servidor.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o catalogo" })).toBeInTheDocument();
  });
});
