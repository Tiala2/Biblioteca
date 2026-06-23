import {
  Bell,
  BookHeart,
  ChartNoAxesColumnIncreasing,
  Gauge,
  Goal,
  Home,
  LibraryBig,
  LogOut,
  Menu,
  MoonStar,
  NotebookPen,
  Search,
  Settings2,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";
import { useTheme } from "@shared/ui/theme/ThemeContext";

export function AppLayout() {
  const { auth, logout } = useAuth();
  const { mode, theme, cycleMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const themeModeLabel = mode === "auto" ? "Automático" : mode === "night" ? "Noite" : "Dia";
  const activeThemeLabel = theme === "night" ? "Noite ativa" : "Dia ativo";

  const onLogout = () => {
    logout();
    navigate("/login");
  };
  const closeSidebar = () => setSidebarOpen(false);
  const onGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = globalSearch.trim();
    navigate(query ? `/books?q=${encodeURIComponent(query)}` : "/books");
    closeSidebar();
  };

  return (
    <div className="app-shell narrative-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo principal
      </a>
      <button
        type="button"
        className="mobile-nav-toggle btn-muted"
        aria-label={sidebarOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
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
        aria-label="Fechar menu de navegação"
        onClick={closeSidebar}
      />
      <aside id="app-sidebar" className={sidebarOpen ? "sidebar card sidebar--open" : "sidebar card"}>
        <div className="brand-block">
          <div className="app-brand">
            <img src="/assets/brand/library-journey-icon.png" alt="" aria-hidden="true" />
            <div>
              <h1>Library</h1>
              <p className="subtitle">Biblioteca digital</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação do usuário">
          <div className="nav-group">
            <p className="eyebrow">Leitura</p>
            <NavLink to="/" end onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Home aria-hidden="true" />
              Página Inicial
            </NavLink>
            <NavLink to="/books" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <LibraryBig aria-hidden="true" />
              Explorar Livros
            </NavLink>
            <NavLink to="/favorites" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <BookHeart aria-hidden="true" />
              Minha Estante
            </NavLink>
            <NavLink to="/reviews" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <NotebookPen aria-hidden="true" />
              Minhas Avaliações
            </NavLink>
          </div>

          <div className="nav-group">
            <p className="eyebrow">Progresso</p>
            <NavLink to="/goals" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Goal aria-hidden="true" />
              Metas
            </NavLink>
            <NavLink to="/badges" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Sparkles aria-hidden="true" />
              Conquistas e Medalhas
            </NavLink>
            <NavLink to="/leaderboard" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <ChartNoAxesColumnIncreasing aria-hidden="true" />
              Classificação
            </NavLink>
          </div>

          <div className="nav-group">
            <p className="eyebrow">Conta</p>
            <NavLink to="/profile" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <User aria-hidden="true" />
              Meu Perfil
            </NavLink>
          </div>
        </nav>

        {auth?.roles.includes("ROLE_ADMIN") && (
          <div className="admin-zone">
            <p className="eyebrow">Administração</p>
            <NavLink to="/admin" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Gauge aria-hidden="true" />
              Administração
            </NavLink>
            <NavLink to="/admin/catalog" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <LibraryBig aria-hidden="true" />
              Gestão do Catálogo
            </NavLink>
            <NavLink to="/admin/engagement" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Sparkles aria-hidden="true" />
              Conquistas e Engajamento
            </NavLink>
            <NavLink to="/admin/users" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Users aria-hidden="true" />
              Gestão de Usuários
            </NavLink>
            <NavLink to="/admin/alerts" onClick={closeSidebar} className={({ isActive }) => (isActive ? "nav-link admin-link active" : "nav-link admin-link")}>
              <Bell aria-hidden="true" />
              Central de Alertas
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
          <form className="topbar-search" role="search" onSubmit={onGlobalSearch}>
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="global-search">Buscar livro, autor ou categoria</label>
            <input
              id="global-search"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Buscar livro, autor, categoria..."
            />
          </form>
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
