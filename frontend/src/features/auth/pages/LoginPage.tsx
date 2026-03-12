import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { BookOpen, Lock, Mail } from "lucide-react";
import { useAuth } from "@features/auth/context/AuthContext";
import { extractApiErrorMessage } from "@shared/api/errors";
import { useToast } from "@shared/ui/toast/ToastContext";
import "./LoginPage.css";

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          setError("Falha de conexão com a API. Verifique se o backend está ativo em http://localhost:8080.");
          showToast("Falha de conexão com o backend.", "error");
          return;
        }

        if (err.response.status === 401) {
          setError("Credenciais inválidas.");
          showToast("Falha no login. Verifique email e senha.", "error");
          return;
        }

        const fallback = `Erro na API (${err.response.status}).`;
        const apiMessage = extractApiErrorMessage(err, fallback);
        setError(apiMessage ?? fallback);
        showToast(apiMessage ?? fallback, "error");
        return;
      }

      setError("Erro inesperado no login.");
      showToast("Erro inesperado no login.", "error");
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
            <BookOpen size={28} strokeWidth={2.2} />
            <span>Library</span>
          </div>
          <p className="login-subtitle">Biblioteca Pública Digital</p>

          <label htmlFor="login-email">Email</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><Mail size={18} /></span>
            <input
              id="login-email"
              className="login-input ds-input"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="login-password">Senha</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><Lock size={18} /></span>
            <input
              id="login-password"
              className="login-input ds-input"
              placeholder="Digite sua senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit ds-btn-primary" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>

          <p className="login-footnote">
            <Link className="login-link login-link-muted" to="/forgot-password">
              Esqueceu a senha?
            </Link>
          </p>
          <p className="login-footnote">
            Não tem conta? <Link className="login-link login-link-cta" to="/register">Criar conta</Link>
          </p>
        </form>
      </section>
    </div>
  );
}


