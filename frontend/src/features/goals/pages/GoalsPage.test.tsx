import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { GoalsPage } from "./GoalsPage";

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
    put: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

function mockGoalLoad() {
  vi.mocked(api.get)
    .mockResolvedValueOnce({
      data: {
        period: "MONTHLY",
        targetPages: 120,
        progressPages: 60,
        progressPercent: 50,
        remainingPages: 60,
        expiresInDays: 12,
        paceWarning: false,
        status: "ACTIVE",
      },
    } as never)
    .mockResolvedValueOnce({
      data: [
        {
          id: "alert-1",
          type: "PACE",
          severity: "INFO",
          message: "Bom ritmo de leitura.",
          suggestedDailyPages: 5,
        },
      ],
    } as never)
    .mockResolvedValueOnce({ data: { streakDays: 4 } } as never);
}

describe("GoalsPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.put).mockReset();
  });

  it("deve carregar meta e salvar nova configuracao", async () => {
    mockGoalLoad();
    vi.mocked(api.put).mockResolvedValue({
      data: {
        period: "MONTHLY",
        targetPages: 150,
        progressPages: 60,
        progressPercent: 40,
        remainingPages: 90,
        expiresInDays: 12,
        paceWarning: false,
        status: "ACTIVE",
      },
    } as never);
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] } as never)
      .mockResolvedValueOnce({ data: { streakDays: 4 } } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/goals"]}>
        <Routes>
          <Route path="/goals" element={<GoalsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Transforme leitura em constancia" })).toBeInTheDocument();
    expect(screen.getByText("Bom ritmo de leitura.")).toBeInTheDocument();

    const targetInput = screen.getByDisplayValue("120");
    await user.clear(targetInput);
    await user.type(targetInput, "150");
    await user.click(screen.getByRole("button", { name: "Salvar meta" }));

    await waitFor(() =>
      expect(vi.mocked(api.put)).toHaveBeenCalledWith(
        "/api/v1/users/me/goals",
        { period: "MONTHLY", targetPages: 150 },
        { headers: { Authorization: "Bearer test-token" } }
      )
    );
    expect(showToast).toHaveBeenCalledWith("Meta atualizada com sucesso.", "success");
  });
});
