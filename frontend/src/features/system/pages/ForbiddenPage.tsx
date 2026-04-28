import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="center-page">
      <article className="card">
        <p className="eyebrow">Permissao</p>
        <h2>Acesso negado</h2>
        <p className="section-sub">Seu perfil nao tem permissao para esta area.</p>
        <div className="card-actions">
          <Link className="btn-link" to="/">
            Voltar
          </Link>
        </div>
      </article>
    </div>
  );
}
