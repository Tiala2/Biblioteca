import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

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

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("deve exibir mensagem amigavel quando a recuperacao for limitada por taxa", async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          message: "Muitas solicitacoes de recuperacao. Aguarde alguns minutos antes de tentar novamente.",
        },
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "leitora@email.com");
    await user.click(screen.getByRole("button", { name: "Enviar link por email" }));

    expect(await screen.findByText("Muitas solicitacoes de recuperacao. Aguarde alguns minutos antes de tentar novamente.")).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith("Falha ao solicitar recuperacao de senha.", "error");
  });
});
