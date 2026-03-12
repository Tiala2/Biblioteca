import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="center-page">
      <article className="card">
        <h2>Acesso negado</h2>
        <p>Seu perfil não tem permissão para esta área.</p>
        <Link to="/">Voltar</Link>
      </article>
    </div>
  );
}


