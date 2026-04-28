import { act, render, screen } from "@testing-library/react";
import { AuthProvider } from "./AuthContext";
import { AUTH_EXPIRED_EVENT } from "@shared/auth/authStorage";
import { ToastProvider } from "@shared/ui/toast/ToastContext";

describe("AuthProvider", () => {
  it("exibe mensagem quando a sessao expira", async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <div>app</div>
        </AuthProvider>
      </ToastProvider>
    );

    act(() => {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    });

    expect(await screen.findByText("Sua sessao expirou. Faca login novamente.")).toBeInTheDocument();
  });
});
