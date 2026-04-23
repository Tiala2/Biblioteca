import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LeaderboardPage } from "./LeaderboardPage";

const authHeaders = { Authorization: "Bearer test-token" };

vi.mock("@shared/hooks/useAuthHeaders", () => {
  return {
    useAuthHeaders: () => authHeaders,
  };
});

vi.mock("@shared/api/http", () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

import { api } from "@shared/api/http";

describe("LeaderboardPage", () => {
  it("deve carregar ranking semanal por paginas", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          { userId: "1", name: "Ana", value: 120, metric: "PAGES" },
          { userId: "2", name: "Bruno", value: 90, metric: "PAGES" },
        ],
      } as never)
      .mockResolvedValueOnce({
        data: { leaderboardOptIn: true },
      } as never);

    render(
      <MemoryRouter initialEntries={["/leaderboard"]}>
        <Routes>
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findAllByRole("heading", { name: "Ana" })).not.toHaveLength(0);
    expect(screen.getAllByRole("heading", { name: "Bruno" })).not.toHaveLength(0);
    expect(screen.getAllByText("120 pagina(s)")).not.toHaveLength(0);
    expect(screen.getByText("Opt-in ativo")).toBeInTheDocument();
  });

  it("deve trocar a metrica ao clicar na aba de livros", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [{ userId: "1", name: "Ana", value: 120, metric: "PAGES" }],
      } as never)
      .mockResolvedValueOnce({
        data: { leaderboardOptIn: false },
      } as never)
      .mockResolvedValueOnce({
        data: [{ userId: "3", name: "Carla", value: 4, metric: "BOOKS" }],
      } as never)
      .mockResolvedValueOnce({
        data: { leaderboardOptIn: false },
      } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/leaderboard"]}>
        <Routes>
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findAllByRole("heading", { name: "Ana" })).not.toHaveLength(0);
    await user.click(screen.getByRole("tab", { name: "Livros concluidos" }));

    await waitFor(() =>
      expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/v1/users/leaderboard?limit=10&metric=BOOKS")
    );
    expect(await screen.findAllByRole("heading", { name: "Carla" })).not.toHaveLength(0);
  });
});
