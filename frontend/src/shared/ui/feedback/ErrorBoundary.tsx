import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Erro inesperado na interface", error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="center-page" role="alert" aria-live="assertive">
        <article className="card error-boundary-card">
          <p className="eyebrow">Erro inesperado</p>
          <h2>Nao foi possivel carregar esta tela</h2>
          <p className="section-sub">A sessao foi preservada. Recarregue a pagina e tente novamente.</p>
          <div className="card-actions">
            <button type="button" onClick={this.handleReload}>
              Recarregar
            </button>
          </div>
        </article>
      </main>
    );
  }
}
