import { isAxiosError } from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { extractApiErrorMessage, extractFieldErrorMessages } from "@shared/api/errors";
import { api } from "@shared/api/http";
import { useToast } from "@shared/ui/toast/ToastContext";
import "./LoginPage.css";

type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

type ApiError = { message?: string };

function getRegisterErrorMessage(error: unknown): string {
  if (!isAxiosError<ApiError>(error)) {
    return "Não foi possível criar sua conta agora. Tente novamente.";
  }
  if (error.response?.status === 409) {
    return "Este email já está cadastrado.";
  }
  const fieldErrors = extractFieldErrorMessages(error);
  if (fieldErrors.length > 0) {
    return `Revise os dados: ${fieldErrors.join(" | ")}`;
  }
  return extractApiErrorMessage(error, "Não foi possível criar sua conta. Verifique os dados informados.");
}

export function RegisterPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterRequest>({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/users", form);
      showToast("Conta criada com sucesso. Faça login para continuar.", "success");
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const message = getRegisterErrorMessage(err);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
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
          <h2 className="login-title">Criar sua conta</h2>
          <p className="login-subtitle">Organize leituras, metas e descobertas em um só lugar.</p>

          <label htmlFor="register-name">Nome</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><User size={18} /></span>
            <input
              id="register-name"
              className="login-input ds-input"
              placeholder="Seu nome"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={3}
            />
          </div>

          <label htmlFor="register-email">Email</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><Mail size={18} /></span>
            <input
              id="register-email"
              className="login-input ds-input"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>

          <label htmlFor="register-password">Senha</label>
          <div className="login-input-wrap login-input-wrap--password ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><Lock size={18} /></span>
            <input
              id="register-password"
              className="login-input ds-input"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={6}
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

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit ds-btn-primary" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>

          <p className="login-footnote">
            Já tem conta? <Link className="login-link login-link-cta" to="/login">Entrar</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
