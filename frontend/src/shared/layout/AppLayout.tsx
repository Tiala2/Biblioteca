import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";
import { useTheme } from "@shared/ui/theme/ThemeContext";

export function AppLayout() {
  const { auth, logout } = useAuth();
  const { mode, theme, cycleMode } = useTheme();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell narrative-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteudo principal
      </a>
      <aside className="sidebar card">
        <div className="brand-block">
          <p className="eyebrow">Library Journey</p>
          <h1>Library</h1>
          <p className="subtitle">Experiencia narrativa inteligente</p>
        </div>

        <nav className="sidebar-nav" aria-label="Navegacao usuario">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Inicio
          </NavLink>
          <NavLink to="/books" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Livros
          </NavLink>
          <NavLink to="/favorites" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Favoritos
          </NavLink>
          <NavLink to="/reviews" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Reviews
          </NavLink>
          <NavLink to="/goals" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Metas
          </NavLink>
          <NavLink to="/badges" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Badges
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Ranking
          </NavLink>
        </nav>

        {auth?.roles.includes("ROLE_ADMIN") && (
          <div className="admin-zone">
            <p className="eyebrow">Area Admin</p>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              Painel Admin
            </NavLink>
            <a className="nav-link admin-link" href="/admin#admin-books">Gerenciar Livros</a>
            <a className="nav-link admin-link" href="/admin#admin-categories">Gerenciar Categorias</a>
            <a className="nav-link admin-link" href="/admin#admin-badges">Gerenciar Badges</a>
            <a className="nav-link admin-link" href="/admin#admin-metrics">Relatorios</a>
            <p className="role-pill admin-pill">Admin</p>
          </div>
        )}

        <div className="sidebar-user">
          <p className="user-name">{auth?.name}</p>
          <button onClick={onLogout}>Sair</button>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar card">
          <div className="brand-block">
            <h2>Biblioteca Digital com Experiencia Narrativa Inteligente</h2>
            <p className="subtitle">Leitura com estado da trama, metas e conquistas.</p>
          </div>
          <div className="user-box">
            <span className="kpi">
              {theme === "night" ? "Tema Noite" : "Tema Dia"} ({mode})
            </span>
            <button className="btn-muted" onClick={cycleMode}>
              {mode === "auto" ? "Auto" : mode === "night" ? "Noite" : "Dia"}
            </button>
          </div>
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </section>
    </div>
  );
}

