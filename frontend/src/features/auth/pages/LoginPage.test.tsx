import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const showToast = vi.fn();
const loginMock = vi.fn();

vi.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock("@shared/ui/toast/ToastContext", () => ({
  useToast: () => ({
    showToast,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    loginMock.mockReset();
  });

  it("deve exibir mensagem amigavel quando o login for limitado por taxa", async () => {
    loginMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          message: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.",
        },
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "admin@email.com");
    await user.type(screen.getByLabelText("Senha"), "Senha@123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.")).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith("Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.", "error");
    expect(screen.queryByText("home-page")).not.toBeInTheDocument();
  });
});
