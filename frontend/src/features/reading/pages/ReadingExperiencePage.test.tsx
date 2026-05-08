import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ReadingExperiencePage } from "./ReadingExperiencePage";

const showToast = vi.fn();
const authState = {
  token: "test-token",
};

vi.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    auth: authState,
  }),
}));

vi.mock("@shared/ui/toast/ToastContext", () => ({
  useToast: () => ({
    showToast,
  }),
}));

vi.mock("@shared/api/http", () => ({
  api: {
    defaults: {
      baseURL: "http://localhost:8080",
    },
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

describe("ReadingExperiencePage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it("deve carregar leitura e salvar progresso", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          id: "book-1",
          title: "Livro de Leitura",
          isbn: "9780000000001",
          numberOfPages: 200,
          coverUrl: null,
          hasPdf: true,
          source: "LOCAL",
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          readings: [
            {
              id: "reading-1",
              status: "IN_PROGRESS",
              currentPage: 40,
              progress: 20,
              startedAt: "2026-04-20T12:00:00",
              lastReadedAt: "2026-04-21T12:00:00",
              book: { id: "book-1", title: "Livro de Leitura" },
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: [{ bookId: "book-1" }],
      } as never)
      .mockResolvedValueOnce({
        data: {
          phase: "DEVELOPMENT",
          plotState: "A trama esta em desenvolvimento.",
          beatTitle: "Capitulo central",
          knownCharacters: [],
          quizzes: [],
          achievements: [],
        },
      } as never);
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: "reading-1",
        status: "IN_PROGRESS",
        currentPage: 40,
        progress: 20,
        startedAt: "2026-04-20T12:00:00",
        lastReadedAt: "2026-04-21T12:00:00",
      },
    } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/books/book-1/read"]}>
        <Routes>
          <Route path="/books/:bookId/read" element={<ReadingExperiencePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Livro de Leitura" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Painel de progresso" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar progresso" }));

    await waitFor(() =>
      expect(vi.mocked(api.post)).toHaveBeenCalledWith(
        "/api/v1/readings",
        { bookId: "book-1", currentPage: 40 },
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
    expect(showToast).toHaveBeenCalledWith("Progresso de leitura salvo.", "success");
  });
});
