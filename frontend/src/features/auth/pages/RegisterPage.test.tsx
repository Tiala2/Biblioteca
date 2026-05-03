import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";

const showToast = vi.fn();

vi.mock("@shared/ui/toast/ToastContext", () => ({
  useToast: () => ({
    showToast,
  }),
}));

vi.mock("@shared/api/http", () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from "@shared/api/http";

describe("RegisterPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("deve cadastrar usuario e redirecionar para login", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Nome"), "Leitora Teste");
    await user.type(screen.getByLabelText("Email"), "leitora@email.com");
    await user.type(screen.getByLabelText("Senha"), "Senha@123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() =>
      expect(vi.mocked(api.post)).toHaveBeenCalledWith("/api/v1/users", {
        name: "Leitora Teste",
        email: "leitora@email.com",
        password: "Senha@123",
      })
    );
    expect(showToast).toHaveBeenCalledWith("Conta criada com sucesso. Faca login para continuar.", "success");
    expect(await screen.findByText("login-page")).toBeInTheDocument();
  });
});
