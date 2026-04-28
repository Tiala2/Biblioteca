import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { AppRouter } from "./router";

vi.mock("@features/auth/routes/ProtectedRoute", () => ({
  ProtectedRoute: () => <Outlet />,
}));

vi.mock("@features/auth/routes/RoleRoute", () => ({
  RoleRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@shared/layout/AppLayout", () => ({
  AppLayout: () => <Outlet />,
}));

vi.mock("@features/auth/pages/LoginPage", () => ({
  LoginPage: () => <div>login-page</div>,
}));

vi.mock("@features/auth/pages/RegisterPage", () => ({
  RegisterPage: () => <div>register-page</div>,
}));

vi.mock("@features/auth/pages/ForgotPasswordPage", () => ({
  ForgotPasswordPage: () => <div>forgot-password-page</div>,
}));

vi.mock("@features/system/pages/ForbiddenPage", () => ({
  ForbiddenPage: () => <div>forbidden-page</div>,
}));

vi.mock("@features/home/pages/HomePage", () => ({
  HomePage: () => <div>home-page</div>,
}));

vi.mock("@features/books/pages/BooksPage", () => ({
  BooksPage: () => <div>books-page</div>,
}));

vi.mock("@features/books/pages/BookDetailsPage", () => ({
  BookDetailsPage: () => <div>book-details-page</div>,
}));

vi.mock("@features/reading/pages/ReadingExperiencePage", () => ({
  ReadingExperiencePage: () => <div>reading-page</div>,
}));

vi.mock("@features/profile/pages/ProfilePage", () => ({
  ProfilePage: () => <div>profile-page</div>,
}));

vi.mock("@features/favorites/pages/FavoritesPage", () => ({
  FavoritesPage: () => <div>favorites-page</div>,
}));

vi.mock("@features/reviews/pages/ReviewsPage", () => ({
  ReviewsPage: () => <div>reviews-page</div>,
}));

vi.mock("@features/goals/pages/GoalsPage", () => ({
  GoalsPage: () => <div>goals-page</div>,
}));

vi.mock("@features/badges/pages/BadgesPage", () => ({
  BadgesPage: () => <div>badges-page</div>,
}));

vi.mock("@features/leaderboard/pages/LeaderboardPage", () => ({
  LeaderboardPage: () => <div>leaderboard-page</div>,
}));

vi.mock("@features/admin/pages/AdminPage", () => ({
  AdminPage: () => <div>admin-overview-page</div>,
}));

vi.mock("@features/admin/pages/AdminCatalogPage", () => ({
  AdminCatalogPage: () => <div>admin-catalog-page</div>,
}));

vi.mock("@features/admin/pages/AdminEngagementPage", () => ({
  AdminEngagementPage: () => <div>admin-engagement-page</div>,
}));

vi.mock("@features/admin/pages/AdminUsersPage", () => ({
  AdminUsersPage: () => <div>admin-users-page</div>,
}));

vi.mock("@features/admin/pages/AdminAlertsPage", () => ({
  AdminAlertsPage: () => <div>admin-alerts-page</div>,
}));

function renderRouter(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRouter />
    </MemoryRouter>
  );
}

describe("AppRouter admin routes", () => {
  it("abre a visao geral em /admin", async () => {
    renderRouter("/admin");

    expect(await screen.findByText("admin-overview-page")).toBeInTheDocument();
  });

  it("abre catalogo em /admin/catalog", async () => {
    renderRouter("/admin/catalog");

    expect(await screen.findByText("admin-catalog-page")).toBeInTheDocument();
  });

  it("abre engajamento em /admin/engagement", async () => {
    renderRouter("/admin/engagement");

    expect(await screen.findByText("admin-engagement-page")).toBeInTheDocument();
  });

  it("abre usuarios em /admin/users", async () => {
    renderRouter("/admin/users");

    expect(await screen.findByText("admin-users-page")).toBeInTheDocument();
  });

  it("abre alertas em /admin/alerts", async () => {
    renderRouter("/admin/alerts");

    expect(await screen.findByText("admin-alerts-page")).toBeInTheDocument();
  });
});
