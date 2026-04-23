import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ReviewsPage } from "./ReviewsPage";

const showToast = vi.fn();

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
      showToast,
    }),
  };
});

vi.mock("@shared/api/http", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import { api } from "@shared/api/http";

describe("ReviewsPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it("deve exibir o titulo do livro no lugar do id bruto", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: "review-1",
              bookId: "book-1",
              rating: 5,
              comment: "Excelente",
              createdAt: "2026-04-03T00:00:00",
              updatedAt: "2026-04-03T00:00:00",
            },
          ],
          page: { size: 8, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          content: [{ id: "book-1", title: "Livro Exibido" }],
          page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: [
          {
            id: "reading-1",
            status: "IN_PROGRESS",
            book: { id: "book-1", title: "Livro Exibido" },
          },
        ],
      } as never);

    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <Routes>
          <Route path="/reviews" element={<ReviewsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Livro Exibido" })).toBeInTheDocument();
    expect(screen.queryByText("Livro: book-1")).not.toBeInTheDocument();
  });

  it("deve editar uma review existente", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: "review-1",
              bookId: "book-1",
              rating: 5,
              comment: "Comentario original",
              createdAt: "2026-04-03T00:00:00",
              updatedAt: "2026-04-03T00:00:00",
            },
          ],
          page: { size: 8, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          content: [{ id: "book-1", title: "Livro Exibido" }],
          page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: [
          {
            id: "reading-1",
            status: "IN_PROGRESS",
            book: { id: "book-1", title: "Livro Exibido" },
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: "review-1",
              bookId: "book-1",
              rating: 4,
              comment: "Comentario atualizado",
              createdAt: "2026-04-03T00:00:00",
              updatedAt: "2026-04-03T01:00:00",
            },
          ],
          page: { size: 8, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          content: [{ id: "book-1", title: "Livro Exibido" }],
          page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: [
          {
            id: "reading-1",
            status: "IN_PROGRESS",
            book: { id: "book-1", title: "Livro Exibido" },
          },
        ],
      } as never);
    vi.mocked(api.patch).mockResolvedValue({ data: {} } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <Routes>
          <Route path="/reviews" element={<ReviewsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Livro Exibido" });
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const numberInputs = screen.getAllByRole("spinbutton");
    const textInputs = screen.getAllByRole("textbox");
    await user.clear(textInputs[textInputs.length - 1]);
    await user.type(textInputs[textInputs.length - 1], "Comentario atualizado");
    await user.clear(numberInputs[numberInputs.length - 1]);
    await user.type(numberInputs[numberInputs.length - 1], "4");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(vi.mocked(api.patch)).toHaveBeenCalledWith(
        "/api/v1/reviews/review-1",
        { rating: 4, comment: "Comentario atualizado" },
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
    expect(await screen.findByText("Comentario atualizado")).toBeInTheDocument();
  });
});
