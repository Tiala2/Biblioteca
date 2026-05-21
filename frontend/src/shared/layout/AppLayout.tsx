import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Gauge,
  Home,
  LibraryBig,
  LogOut,
  Medal,
  Menu,
  MoonStar,
  PenLine,
  Settings2,
  Sparkles,
  Target,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";
import { useTheme } from "@shared/ui/theme/ThemeContext";

export function AppLayout() {
  const { auth, logout } = useAuth();
  const { mode, theme, cycleMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const themeModeLabel = mode === "auto" ? "Automático" : mode === "night" ? "Noite" : "Dia";
  const activeThemeLabel = theme === "night" ? "Noite ativa" : "Dia ativo";

  const onLogout = () => {
    logout();
    navigate("/login");
  };
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell narrative-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo principal
      </a>
      <button
        type="button"
        className="mobile-nav-toggle btn-muted"
        aria-label={sidebarOpen ? "Fechar menu de navegacao" : "Abrir menu de navegacao"}
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
        onClick={() => setSidebarOpen((current) => !current)}
      >
        {sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        Menu
      </button>
      <button
        type="button"
        className={sidebarOpen ? "sidebar-backdrop sidebar-backdrop--open" : "sidebar-backdrop"}
        aria-label="Fechar menu de navegacao"
        onClick={closeSidebar}
      />
      <aside id="app-sidebar" className={sidebarOpen ? "sidebar card sidebar--open" : "sidebar card"}>
        <div className="brand-block">
          <p className="eyebrow">Library Journey</p>
          <h1>Biblioteca</h1>
          <p className="subtitle">Experiência narrativa inteligente</p>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação do usuário">
          <NavLink to="/" end onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <Home aria-hidden="true" />
            Início
          </NavLink>
          <NavLink to="/profile" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <User aria-hidden="true" />
            Perfil
          </NavLink>
          <NavLink to="/books" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <BookOpen aria-hidden="true" />
            Livros
          </NavLink>
          <NavLink to="/favorites" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <Bookmark aria-hidden="true" />
            Favoritos
          </NavLink>
          <NavLink to="/reviews" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <PenLine aria-hidden="true" />
            Avaliações
          </NavLink>
          <NavLink to="/goals" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <Target aria-hidden="true" />
            Metas
          </NavLink>
          <NavLink to="/badges" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <Medal aria-hidden="true" />
            Conquistas
          </NavLink>
          <NavLink to="/leaderboard" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <BarChart3 aria-hidden="true" />
            Ranking
          </NavLink>
        </nav>

        {auth?.roles.includes("ROLE_ADMIN") && (
          <div className="admin-zone">
            <p className="eyebrow">Área Admin</p>
            <NavLink to="/admin" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Gauge aria-hidden="true" />
              Painel administrativo
            </NavLink>
            <NavLink to="/admin/catalog" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <LibraryBig aria-hidden="true" />
              Catálogo
            </NavLink>
            <NavLink to="/admin/engagement" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Sparkles aria-hidden="true" />
              Engajamento
            </NavLink>
            <NavLink to="/admin/users" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Users aria-hidden="true" />
              Usuários
            </NavLink>
            <NavLink to="/admin/alerts" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Bell aria-hidden="true" />
              Alertas
            </NavLink>
            <p className="role-pill admin-pill">Administrador</p>
          </div>
        )}

        <div className="sidebar-user">
          <p className="user-name">{auth?.name}</p>
          <button type="button" onClick={onLogout} aria-label="Encerrar sessão">
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar card">
          <div className="brand-block">
            <h2>Biblioteca Digital com Experiência Narrativa Inteligente</h2>
            <p className="subtitle">Leitura com estado da trama, metas e conquistas.</p>
          </div>
          <div className="user-box">
            <span className="kpi">
              {activeThemeLabel} · {themeModeLabel}
            </span>
            <button
              type="button"
              className="btn-muted"
              onClick={cycleMode}
              aria-label={`Alternar tema. Modo atual: ${themeModeLabel}`}
            >
              {mode === "auto" ? <Settings2 aria-hidden="true" /> : <MoonStar aria-hidden="true" />}
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

