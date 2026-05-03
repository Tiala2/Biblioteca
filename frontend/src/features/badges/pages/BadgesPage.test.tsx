import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BadgesPage } from "./BadgesPage";

const authHeaders = { Authorization: "Bearer test-token" };

vi.mock("@shared/hooks/useAuthHeaders", () => ({
  useAuthHeaders: () => authHeaders,
}));

vi.mock("@shared/api/http", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

describe("BadgesPage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("deve carregar badges e progresso das proximas conquistas", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: "badge-1",
              code: "FIRST_REVIEW",
              name: "Primeira Review",
              description: "Registrou a primeira avaliacao",
              awardedAt: "2026-04-20T12:00:00",
            },
          ],
          page: { size: 8, number: 0, totalElements: 1, totalPages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          userSummary: { totalFinished: 3, totalPagesRead: 450 },
          readingProgress: { streakDays: 5 },
        },
      } as never);

    render(
      <MemoryRouter initialEntries={["/badges"]}>
        <Routes>
          <Route path="/badges" element={<BadgesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Primeira Review" })).toBeInTheDocument();
    expect(screen.getByText("Registrou a primeira avaliacao")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Streak de 7 dias" })).toBeInTheDocument();
    expect(screen.getByText("5 de 7 dias")).toBeInTheDocument();
  });
});
