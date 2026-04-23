import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";

const showToast = vi.fn();
const authHeaders = {
  Authorization: "Bearer test-token",
};

vi.mock("@features/auth/context/AuthContext", () => {
  return {
    useAuth: () => ({
      auth: {
        token: "test-token",
        name: "Leitora Teste",
      },
    }),
  };
});

vi.mock("@shared/hooks/useAuthHeaders", () => {
  return {
    useAuthHeaders: () => authHeaders,
  };
});

vi.mock("@shared/ui/toast/ToastContext", () => {
  return {
    useToast: () => ({
      showToast,
    }),
  };
});

vi.mock("@shared/api/http", () => {
  return {
    api: {
      get: vi.fn(),
      put: vi.fn(),
    },
  };
});

import { api } from "@shared/api/http";

function mockProfileRequests() {
  vi.mocked(api.get)
    .mockResolvedValueOnce({
      data: {
        id: "user-1",
        name: "Leitora Teste",
        email: "leitora@email.com",
        leaderboardOptIn: true,
        alertsOptIn: false,
        badges: [
          {
            id: "badge-1",
            code: "FIRST_REVIEW",
            name: "Primeira Review",
            description: "Registrou a primeira review",
            awardedAt: "2026-04-20T12:00:00",
          },
        ],
      },
    } as never)
    .mockResolvedValueOnce({
      data: {
        userSummary: {
          totalInProgress: 2,
          totalFinished: 4,
          totalPagesRead: 320,
        },
        readingProgress: {
          streakDays: 6,
          pagesReadThisWeek: 120,
          sessionsThisWeek: 3,
        },
      },
    } as never)
    .mockResolvedValueOnce({
      data: [
        {
          id: "reading-1",
          book: {
            id: "book-1",
            title: "Livro em andamento",
          },
          status: "IN_PROGRESS",
          currentPage: 45,
          progress: 30,
          lastReadedAt: "2026-04-21T18:00:00",
        },
      ],
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "review-1",
            bookId: "book-1",
            rating: 5,
            comment: "Excelente leitura",
            updatedAt: "2026-04-21T19:00:00",
          },
          {
            id: "review-2",
            bookId: "book-2",
            rating: 2,
            comment: "Nao funcionou para mim",
            updatedAt: "2026-04-20T09:00:00",
          },
        ],
      },
    } as never);
}

describe("ProfilePage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.put).mockReset();
  });

  it("deve carregar os indicadores e o historico do perfil", async () => {
    mockProfileRequests();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Perfil e historico de leitura" })).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
    expect(screen.getByText("livros concluidos")).toBeInTheDocument();
    expect(screen.getByText("Livro em andamento")).toBeInTheDocument();
    expect(screen.getByText("Primeira Review")).toBeInTheDocument();
    expect(screen.getByText("Excelente leitura")).toBeInTheDocument();
  });

  it("deve salvar preferencias do usuario", async () => {
    mockProfileRequests();
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Perfil e historico de leitura" });

    const rankingCheckbox = screen.getByRole("checkbox", { name: "Participar do ranking semanal" });
    expect(rankingCheckbox).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Receber alertas internos de leitura" })).not.toBeChecked();

    await user.click(rankingCheckbox);
    await user.click(screen.getByRole("button", { name: "Salvar preferencias" }));

    await waitFor(() =>
      expect(vi.mocked(api.put)).toHaveBeenCalledWith(
        "/api/v1/users/me",
        {
          name: "Leitora Teste",
          email: "leitora@email.com",
          leaderboardOptIn: false,
          alertsOptIn: false,
        },
        {
          headers: {
            Authorization: authHeaders.Authorization,
          },
        }
      )
    );

    expect(showToast).toHaveBeenCalledWith("Preferencias atualizadas com sucesso.", "success");
  });
});
