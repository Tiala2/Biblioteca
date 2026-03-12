import { isAxiosError } from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Lock, Mail, User } from "lucide-react";
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
    return "Falha ao cadastrar. Tente novamente.";
  }
  if (error.response?.status === 409) {
    return "Este email ja esta cadastrado.";
  }
  const fieldErrors = extractFieldErrorMessages(error);
  if (fieldErrors.length > 0) {
    return `Dados invalidos: ${fieldErrors.join(" | ")}`;
  }
  return extractApiErrorMessage(error, "Falha ao cadastrar. Verifique os dados informados.");
}

export function RegisterPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterRequest>({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/users", form);
      showToast("Conta criada com sucesso. Faca login para continuar.", "success");
      navigate("/login");
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
            <BookOpen size={28} strokeWidth={2.2} />
            <span>Library</span>
          </div>
          <h2 className="login-title">Criar Conta</h2>
          <p className="login-subtitle">Biblioteca Publica Digital</p>

          <label htmlFor="register-name">Nome</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><User size={18} /></span>
            <input
              id="register-name"
              className="login-input ds-input"
              placeholder="Seu nome"
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
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>

          <label htmlFor="register-password">Senha</label>
          <div className="login-input-wrap ds-input-wrap">
            <span className="login-input-icon ds-input-icon" aria-hidden="true"><Lock size={18} /></span>
            <input
              id="register-password"
              className="login-input ds-input"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={6}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit ds-btn-primary" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>

          <p className="login-footnote">
            Ja tem conta? <Link className="login-link login-link-cta" to="/login">Entrar</Link>
          </p>
        </form>
      </section>
    </div>
  );
}