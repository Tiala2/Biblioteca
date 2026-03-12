import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastContext";

function Probe() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast("Operacao concluida", "success")}>
      Disparar Toast
    </button>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve exibir e remover toast automaticamente", () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Disparar Toast" }));
    expect(screen.getByText("Operacao concluida")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.queryByText("Operacao concluida")).not.toBeInTheDocument();
  });
});

