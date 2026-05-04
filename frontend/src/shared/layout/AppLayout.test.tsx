import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "./AppLayout";

const logoutMock = vi.fn();
const cycleModeMock = vi.fn();

let authState = {
  name: "Usuario Teste",
  roles: ["ROLE_USER"],
};

vi.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    auth: authState,
    logout: logoutMock,
  }),
}));

vi.mock("@shared/ui/theme/ThemeContext", () => ({
  useTheme: () => ({
    mode: "auto",
    theme: "day",
    cycleMode: cycleModeMock,
  }),
}));

function renderLayout(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>conteudo-inicio</div>} />
          <Route path="/admin" element={<div>conteudo-admin</div>} />
        </Route>
        <Route path="/login" element={<div>pagina-login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      name: "Usuario Teste",
      roles: ["ROLE_USER"],
    };
  });

  it("não exibe navegação admin para usuário comum", () => {
    renderLayout();

    expect(screen.getByText("conteudo-inicio")).toBeInTheDocument();
    expect(screen.getByText("Usuario Teste")).toBeInTheDocument();
    expect(screen.queryByText("Área Admin")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Painel administrativo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Catálogo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuários" })).not.toBeInTheDocument();
  });

  it("exibe subrotas admin para usuario administrador", () => {
    authState = {
      name: "Admin Teste",
      roles: ["ROLE_USER", "ROLE_ADMIN"],
    };

    renderLayout("/admin");

    expect(screen.getByText("conteudo-admin")).toBeInTheDocument();
    expect(screen.getByText("Área Admin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel administrativo" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/admin/catalog");
    expect(screen.getByRole("link", { name: "Engajamento" })).toHaveAttribute("href", "/admin/engagement");
    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: "Alertas" })).toHaveAttribute("href", "/admin/alerts");
  });

  it("faz logout e navega para login", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Encerrar sessão" }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("pagina-login")).toBeInTheDocument();
  });
});
