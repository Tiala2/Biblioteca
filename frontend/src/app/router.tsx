import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@features/auth/routes/ProtectedRoute";
import { RoleRoute } from "@features/auth/routes/RoleRoute";
import { AppLayout } from "@shared/layout/AppLayout";

const LoginPage = lazy(() => import("@features/auth/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("@features/auth/pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("@features/auth/pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const ForbiddenPage = lazy(() => import("@features/system/pages/ForbiddenPage").then((module) => ({ default: module.ForbiddenPage })));
const HomePage = lazy(() => import("@features/home/pages/HomePage").then((module) => ({ default: module.HomePage })));
const BooksPage = lazy(() => import("@features/books/pages/BooksPage").then((module) => ({ default: module.BooksPage })));
const ReadingExperiencePage = lazy(() => import("@features/reading/pages/ReadingExperiencePage").then((module) => ({ default: module.ReadingExperiencePage })));
const FavoritesPage = lazy(() => import("@features/favorites/pages/FavoritesPage").then((module) => ({ default: module.FavoritesPage })));
const ReviewsPage = lazy(() => import("@features/reviews/pages/ReviewsPage").then((module) => ({ default: module.ReviewsPage })));
const GoalsPage = lazy(() => import("@features/goals/pages/GoalsPage").then((module) => ({ default: module.GoalsPage })));
const BadgesPage = lazy(() => import("@features/badges/pages/BadgesPage").then((module) => ({ default: module.BadgesPage })));
const LeaderboardPage = lazy(() => import("@features/leaderboard/pages/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage })));
const AdminPage = lazy(() => import("@features/admin/pages/AdminPage").then((module) => ({ default: module.AdminPage })));

function RouteLoadingFallback() {
  return (
    <section className="card">
      <p className="section-sub">Carregando tela...</p>
    </section>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password/:token" element={<ForgotPasswordPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/books/:bookId/read" element={<ReadingExperiencePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route
              path="/admin"
              element={
                <RoleRoute role="ROLE_ADMIN">
                  <AdminPage />
                </RoleRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

