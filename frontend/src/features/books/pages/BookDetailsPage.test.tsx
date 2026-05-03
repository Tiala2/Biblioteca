import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BookDetailsPage } from "./BookDetailsPage";

const showToast = vi.fn();
const authHeaders = { Authorization: "Bearer test-token" };

vi.mock("@shared/hooks/useAuthHeaders", () => ({
  useAuthHeaders: () => authHeaders,
}));

vi.mock("@shared/ui/toast/ToastContext", () => ({
  useToast: () => ({
    showToast,
  }),
}));

vi.mock("@shared/api/http", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

describe("BookDetailsPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it("deve carregar detalhes e alternar favorito", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          id: "book-1",
          title: "Livro Detalhado",
          author: "Autora",
          isbn: "9780000000001",
          numberOfPages: 220,
          publicationDate: "2020-01-01",
          coverUrl: null,
          hasPdf: true,
          source: "LOCAL",
          averageRating: 4.5,
          totalReviews: 2,
          categories: [{ id: "cat-1", name: "Fantasia" }],
          tags: [{ id: "tag-1", name: "Aventura" }],
        },
      } as never)
      .mockResolvedValueOnce({ data: false } as never)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: "review-1",
              bookId: "book-1",
              rating: 5,
              comment: "Minha review",
              updatedAt: "2026-04-20T12:00:00",
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: "review-2",
              bookId: "book-1",
              rating: 4,
              comment: "Review da comunidade",
              updatedAt: "2026-04-21T12:00:00",
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: [
          {
            id: "book-2",
            title: "Livro Recomendado",
            author: "Outra autora",
            averageRating: 4,
            totalReviews: 1,
          },
        ],
      } as never);
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/books/book-1"]}>
        <Routes>
          <Route path="/books/:bookId" element={<BookDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Livro Detalhado" })).toBeInTheDocument();
    expect(screen.getByText("Fantasia")).toBeInTheDocument();
    expect(screen.getByText("Minha review")).toBeInTheDocument();
    expect(screen.getByText("Review da comunidade")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar nos favoritos" }));

    await waitFor(() =>
      expect(vi.mocked(api.post)).toHaveBeenCalledWith(
        "/api/v1/users/me/favorites",
        { bookId: "book-1" },
        { headers: authHeaders }
      )
    );
    expect(showToast).toHaveBeenCalledWith("Livro adicionado aos favoritos.", "success");
  });
});
