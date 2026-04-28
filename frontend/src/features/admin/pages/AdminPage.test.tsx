import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminPage } from "./AdminPage";

const showToast = vi.fn();

vi.mock("@features/auth/context/AuthContext", () => {
  return {
    useAuth: () => ({
      auth: {
        token: "test-token",
        email: "admin@email.com",
      },
    }),
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
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import { api } from "@shared/api/http";

function mockAdminRequests() {
  vi.mocked(api.get)
    .mockResolvedValueOnce({
      data: {
        totalUsers: 12,
        totalBooks: 30,
        totalReviews: 18,
        totalFavorites: 22,
        totalCollections: 4,
        totalTags: 8,
      },
    } as never)
    .mockResolvedValueOnce({
      data: [{ id: "cat-1", name: "Backend", description: "Livros de backend" }],
    } as never)
    .mockResolvedValueOnce({
      data: [{ id: "tag-1", name: "Java" }],
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "book-1",
            title: "Spring em pratica",
            author: "Equipe",
            isbn: "123",
            numberOfPages: 250,
            publicationDate: "2024-01-01",
            coverUrl: "https://example.com/capa.jpg",
            categories: [{ id: "cat-1", name: "Backend" }],
          },
        ],
      },
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "col-1",
            title: "Favoritos do semestre",
            description: "Colecao teste",
            books: [{ id: "book-1", title: "Spring em pratica" }],
          },
        ],
      },
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "badge-1",
            code: "TOTAL_BOOKS_10",
            name: "Leitor constante",
            description: "Leu 10 livros",
            criteriaType: "TOTAL_BOOKS",
            criteriaValue: "10",
            active: true,
          },
        ],
      },
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            bookId: "book-1",
            bookTitle: "Spring em pratica",
            bookIsbn: "123",
            createdAt: "2026-04-24T12:00:00",
          },
        ],
      },
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "user-1",
            name: "Admin Teste",
            email: "admin@email.com",
            active: true,
            leaderboardOptIn: true,
            alertsOptIn: true,
            role: "ADMIN",
          },
        ],
        page: {
          size: 12,
          number: 0,
          totalElements: 1,
          totalPages: 1,
        },
      },
    } as never)
    .mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "alert-1",
            userId: "user-1",
            email: "admin@email.com",
            alertType: "GOAL_EXPIRING",
            channel: "EMAIL",
            status: "SENT",
            message: "Sua meta esta perto do fim",
            createdAt: "2026-04-24T11:00:00",
          },
        ],
        page: {
          size: 12,
          number: 0,
          totalElements: 1,
          totalPages: 1,
        },
      },
    } as never);
}

describe("AdminPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it("deve carregar as principais secoes do painel admin", async () => {
    mockAdminRequests();

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Painel admin" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getAllByRole("heading", { name: "Gestao de usuarios" }).length).toBeGreaterThan(0));

    expect(screen.getByRole("heading", { name: "Acervo e descoberta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gamificacao e comunidade" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Gestao de usuarios" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Alertas e rastreabilidade" })).toBeInTheDocument();
    expect(screen.getByText("Admin Teste")).toBeInTheDocument();
    expect(screen.getAllByText("Spring em pratica").length).toBeGreaterThan(0);
  });

  it("deve enviar filtro de busca de usuarios para o backend", async () => {
    mockAdminRequests();
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        content: [],
        page: {
          size: 12,
          number: 0,
          totalElements: 0,
          totalPages: 1,
        },
      },
    } as never);

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <AdminPage visibleSections={["users"]} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByRole("heading", { name: "Gestao de usuarios" }).length).toBeGreaterThan(0));
    fireEvent.change(screen.getByPlaceholderText("Buscar usuarios por nome ou email"), { target: { value: "joao" } });

    await waitFor(() =>
      expect(vi.mocked(api.get)).toHaveBeenLastCalledWith(
        "/api/admin/users?page=0&size=12&sort=createdAt%2Cdesc&q=joao",
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
  });

  it("deve atualizar usuario pelo painel admin", async () => {
    mockAdminRequests();
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        content: [
          {
            id: "user-1",
            name: "Admin Ajustado",
            email: "admin@email.com",
            active: true,
            leaderboardOptIn: true,
            alertsOptIn: true,
            role: "ADMIN",
          },
        ],
        page: {
          size: 12,
          number: 0,
          totalElements: 1,
          totalPages: 1,
        },
      },
    } as never);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <AdminPage visibleSections={["users"]} />
      </MemoryRouter>
    );

    await screen.findByText("Admin Teste");
    await user.click(screen.getByRole("button", { name: "Editar" }));

    const nameInput = screen.getByPlaceholderText("Nome do usuario");
    await user.clear(nameInput);
    await user.type(nameInput, "Admin Ajustado");
    await user.click(screen.getByRole("button", { name: "Salvar usuario" }));

    await waitFor(() =>
      expect(vi.mocked(api.put)).toHaveBeenCalledWith(
        "/api/admin/users/user-1",
        {
          name: "Admin Ajustado",
          email: "admin@email.com",
          leaderboardOptIn: true,
          alertsOptIn: true,
          role: "ADMIN",
        },
        { headers: { Authorization: "Bearer test-token" } }
      )
    );

    await waitFor(() => expect(screen.getByText("Admin Ajustado")).toBeInTheDocument());
    expect(showToast).toHaveBeenCalledWith("Usuario atualizado com sucesso.", "success");
  });
});
