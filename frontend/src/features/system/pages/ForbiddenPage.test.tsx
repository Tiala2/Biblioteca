import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ForbiddenPage } from "./ForbiddenPage";

describe("ForbiddenPage", () => {
  it("deve orientar usuario sem permissao e oferecer retorno", () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Acesso negado" })).toBeInTheDocument();
    expect(screen.getByText("Seu perfil nao tem permissao para esta area.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/");
  });
});
