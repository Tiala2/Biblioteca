import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FavoritesPage } from "./FavoritesPage";

const showToast = vi.fn();

vi.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    auth: {
      token: "test-token",
    },
  }),
}));

vi.mock("@shared/ui/toast/ToastContext", () => ({
  useToast: () => ({
    showToast,
  }),
}));

vi.mock("@shared/api/http", () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

describe("FavoritesPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it("deve listar favoritos e remover um livro", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            bookId: "book-1",
            bookTitle: "Livro Favorito",
            bookIsbn: "9780000000001",
            coverUrl: null,
            source: "OPEN",
            createdAt: "2026-04-20T12:00:00",
          },
        ],
      } as never)
      .mockResolvedValueOnce({ data: [] } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Livro Favorito" })).toBeInTheDocument();
    expect(screen.getByText("OPEN LIBRARY")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover Livro Favorito dos favoritos" }));

    await waitFor(() =>
      expect(vi.mocked(api.delete)).toHaveBeenCalledWith(
        "/api/v1/users/me/favorites/book-1",
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
    expect(showToast).toHaveBeenCalledWith("Favorito removido com sucesso.", "success");
  });
});
