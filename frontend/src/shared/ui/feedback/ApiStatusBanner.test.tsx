import { act, render, screen, waitFor } from "@testing-library/react";
import { ApiStatusBanner } from "./ApiStatusBanner";

describe("ApiStatusBanner", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("exibe aviso depois de falhas consecutivas da API", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network offline"));

    render(<ApiStatusBanner />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível confirmar a conexão com a API");
  });

  it("permanece oculto quando a API responder com sucesso", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<ApiStatusBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("remove aviso quando a API volta a responder", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("network offline"))
      .mockRejectedValueOnce(new Error("network offline"))
      .mockResolvedValue({ ok: true });

    render(<ApiStatusBanner />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
