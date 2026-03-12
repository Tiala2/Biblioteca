import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { BookOpen, Lock, Mail } from "lucide-react";
import { extractApiErrorMessage, extractFieldErrorMessages } from "@shared/api/errors";
import { api } from "@shared/api/http";
import { useToast } from "@shared/ui/toast/ToastContext";
import "./LoginPage.css";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const params = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const token = useMemo(() => {
    const rawFromPath = params.token?.trim() ?? "";
    const rawFromQuery = searchParams.get("token")?.trim() ?? "";
    const raw = rawFromPath || rawFromQuery;
    return raw.replace(/[^a-fA-F0-9-]/g, "");
  }, [params.token, searchParams]);
  const isResetFlow = token.length > 0;

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", {
        email,
        baseUrl: window.location.origin,
      });
      setSubmitted(true);
      showToast("Solicitacao registrada. Verifique seu email.", "info");
    } catch (err: unknown) {
      if (!isAxiosError(err)) {
        setError("Nao foi possivel enviar o email de recuperacao.");
      } else {
        const fieldErrors = extractFieldErrorMessages(err);
        if (fieldErrors.length > 0) {
          setError(`Dados invalidos: ${fieldErrors.join(" | ")}`);
        } else {
          setError(extractApiErrorMessage(err, "Nao foi possivel enviar o email de recuperacao."));
        }
      }
      showToast("Falha ao solicitar recuperacao de senha.", "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReset = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no minimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset-password", { token, newPassword });
      setResetDone(true);
      setTokenInvalid(false);
      showToast("Senha redefinida com sucesso.", "success");
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err: unknown) {
      setTokenInvalid(true);
      if (!isAxiosError(err)) {
        setError("Nao foi possivel redefinir a senha.");
      } else {
        const fieldErrors = extractFieldErrorMessages(err);
        if (fieldErrors.length > 0) {
          setError(`Dados invalidos: ${fieldErrors.join(" | ")}`);
        } else {
          setError(extractApiErrorMessage(err, "Link invalido ou expirado."));
        }
      }
      showToast("Falha ao redefinir senha.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page ds-page-bg-galaxy">
      <div className="login-overlay" />
      <section className="login-shell">
        <form className="login-form ds-glass-card" onSubmit={isResetFlow ? onSubmitReset : onSubmitRequest}>
          <div className="login-logo">
            <BookOpen size={28} strokeWidth={2.2} />
            <span>Library</span>
          </div>
          <h2 className="login-title">{isResetFlow ? "Definir Nova Senha" : "Recuperar Senha"}</h2>
          <p className="login-subtitle">{isResetFlow ? "Defina sua nova senha pelo link enviado no email" : "Recuperacao de senha"}</p>

          {!isResetFlow && (
            <>
              <label htmlFor="forgot-email">Email</label>
              <div className="login-input-wrap ds-input-wrap">
                <span className="login-input-icon ds-input-icon" aria-hidden="true"><Mail size={18} /></span>
                <input
                  id="forgot-email"
                  className="login-input ds-input"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </>
          )}

          {isResetFlow && (
            <>
              {tokenInvalid && (
                <p className="login-footnote">
                  Link invalido ou expirado. Voce pode solicitar um novo link para continuar.
                </p>
              )}
              <label htmlFor="reset-password">Nova senha</label>
              <div className="login-input-wrap ds-input-wrap">
                <span className="login-input-icon ds-input-icon" aria-hidden="true"><Lock size={18} /></span>
                <input
                  id="reset-password"
                  className="login-input ds-input"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <label htmlFor="reset-confirm-password">Confirmar nova senha</label>
              <div className="login-input-wrap ds-input-wrap">
                <span className="login-input-icon ds-input-icon" aria-hidden="true"><Lock size={18} /></span>
                <input
                  id="reset-confirm-password"
                  className="login-input ds-input"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {error && <p className="login-error">{error}</p>}

          {!isResetFlow && submitted && (
            <p className="login-footnote">
              Se o email existir, voce recebera um link para redefinir a senha.
            </p>
          )}

          {isResetFlow && resetDone && (
            <p className="login-footnote">
              Senha redefinida. Voce sera redirecionado para login.
            </p>
          )}

          <button type="submit" className="login-submit ds-btn-primary" disabled={loading}>
            {loading ? "Processando..." : isResetFlow ? "Salvar nova senha" : "Enviar link por email"}
          </button>

          {isResetFlow && (
            <button
              type="button"
              className="login-submit ds-btn-primary"
              onClick={() => navigate("/forgot-password")}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              Solicitar novo link
            </button>
          )}

          <p className="login-footnote">
            Lembrou a senha? <Link className="login-link login-link-cta" to="/login">Voltar ao login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
