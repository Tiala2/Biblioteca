import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { useAuth } from "@features/auth/context/AuthContext";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useToast } from "@shared/ui/toast/ToastContext";
import "./LoginPage.css";

const NETWORK_ERROR_MESSAGE = "Não foi possível conversar com o servidor. Verifique se o backend está ativo.";

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      showToast("Login realizado com sucesso.", "success");
      navigate("/");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (!err.response) {
          setError(NETWORK_ERROR_MESSAGE);
          showToast(NETWORK_ERROR_MESSAGE, "error");
          return;
        }

        if (err.response.status === 401) {
          setError("Credenciais inválidas.");
          showToast("Falha no login. Verifique email e senha.", "error");
          return;
        }

        if (err.response.status === 429) {
          const apiMessage = extractApiErrorMessage(err, "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.");
          setError(apiMessage);
          showToast(apiMessage, "error");
          return;
        }

        const fallback = `Não foi possível entrar agora. Código ${err.response.status}.`;
        const apiMessage = extractApiErrorMessage(err, fallback);
        setError(apiMessage ?? fallback);
        showToast(apiMessage ?? fallback, "error");
        return;
      }

      setError("Não foi possível entrar agora. Tente novamente em instantes.");
      showToast("Não foi possível entrar agora.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page ds-page-bg-galaxy">
      <div className="login-overlay" />
      <section className="login-shell">
        <form className="login-form ds-glass-card" onSubmit={onSubmit}>
          <div className="login-logo">
            <img src="/assets/brand/library-journey-icon.png" alt="" aria-hidden="true" />
            <span className="login-brand-text">
              <strong>Library</strong>
            </span>
          </div>
          <h1 className="login-title">Cada livro pode mudar uma parte da sua história.</h1>
          <p className="login-subtitle">
            <span>Vamos começar?</span>
          </p>

          <label className="sr-only" htmlFor="login-email">Email</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><UserRound size={18} /></span>
            <input
              id="login-email"
              className="login-input ds-input"
              placeholder="Digite seu email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="sr-only" htmlFor="login-password">Senha</label>
          <div className="login-input-wrap login-input-wrap--password ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><Lock size={18} /></span>
            <input
              id="login-password"
              className="login-input ds-input"
              placeholder="Digite sua senha"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <p className="login-forgot-row">
            <Link className="login-link login-link-muted" to="/forgot-password">
              Esqueceu sua senha?
            </Link>
          </p>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit ds-btn-primary" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>

          <p className="login-footnote">
            Não tem uma conta? <Link className="login-link login-link-cta" to="/register">Cadastre-se</Link>
          </p>
        </form>
      </section>
    </div>
  );
}


