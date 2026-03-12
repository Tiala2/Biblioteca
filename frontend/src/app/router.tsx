import { Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "@features/admin/pages/AdminPage";
import { ForgotPasswordPage } from "@features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "@features/auth/pages/LoginPage";
import { RegisterPage } from "@features/auth/pages/RegisterPage";
import { ProtectedRoute } from "@features/auth/routes/ProtectedRoute";
import { RoleRoute } from "@features/auth/routes/RoleRoute";
import { BadgesPage } from "@features/badges/pages/BadgesPage";
import { BooksPage } from "@features/books/pages/BooksPage";
import { FavoritesPage } from "@features/favorites/pages/FavoritesPage";
import { GoalsPage } from "@features/goals/pages/GoalsPage";
import { HomePage } from "@features/home/pages/HomePage";
import { LeaderboardPage } from "@features/leaderboard/pages/LeaderboardPage";
import { ReadingExperiencePage } from "@features/reading/pages/ReadingExperiencePage";
import { ReviewsPage } from "@features/reviews/pages/ReviewsPage";
import { ForbiddenPage } from "@features/system/pages/ForbiddenPage";
import { AppLayout } from "@shared/layout/AppLayout";

export function AppRouter() {
  return (
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
  );
}

