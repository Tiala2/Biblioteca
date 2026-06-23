import { act, render, screen, waitFor } from "@testing-library/react";
import { ApiStatusBanner } from "./ApiStatusBanner";

describe("ApiStatusBanner", () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    vi.useRealTimers();
  });

  it("mantem o aviso tecnico fora da interface quando a API falha", async () => {
    vi.useFakeTimers();
    const warn = vi.fn();
    console.warn = warn;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network offline"));

    render(<ApiStatusBanner />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("API indisponível"));
  });

  it("permanece silencioso quando a API responder com sucesso", async () => {
    const warn = vi.fn();
    console.warn = warn;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<ApiStatusBanner />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
  });

  it("para de registrar falha quando a API volta a responder", async () => {
    vi.useFakeTimers();
    const warn = vi.fn();
    console.warn = warn;
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("network offline"))
      .mockRejectedValueOnce(new Error("network offline"))
      .mockResolvedValue({ ok: true });

    render(<ApiStatusBanner />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(warn).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
