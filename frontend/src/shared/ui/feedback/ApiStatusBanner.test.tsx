import { render, screen, waitFor } from "@testing-library/react";
import { ApiStatusBanner } from "./ApiStatusBanner";

describe("ApiStatusBanner", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("exibe aviso quando a API estiver indisponivel", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network offline"));

    render(<ApiStatusBanner />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("API indisponivel");
    });
  });

  it("permanece oculto quando a API responder com sucesso", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<ApiStatusBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
