import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardLayout from "./pages/DashboardLayout";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import AdminReports from "./pages/AdminReports";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Registration from "./pages/Registration";
import Notifications from "./pages/Notifications";
import UserProfile from "./pages/UserProfile";
import { useUsers } from "./contexts/UserContext";
import { Toaster } from "react-hot-toast";
import FirstLoginModal from "./components/FirstLoginPopup";

function App() {
  const { currentUser, loading, showFirstLogin, markFirstLoginSeen } =
    useUsers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // --- Protected route ---
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!currentUser) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return currentUser.role === "admin" ? (
        <Navigate to="/admin" replace />
      ) : (
        <Navigate to="/dashboard" replace />
      );
    }
    return children;
  };

  // --- Public route ---
  const PublicRoute = ({ children }) => {
    if (currentUser) {
      return currentUser.role === "admin" ? (
        <Navigate to="/admin" replace />
      ) : (
        <Navigate to="/dashboard" replace />
      );
    }
    return children;
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            minHeight: "60px",
            width: "320px",
            marginRight: "20px",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            fontSize: "14px",
          },
          success: {
            duration: 3000,
            style: {
              background: "#E6FFFA",
              color: "#2F855A",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#FFF5F5",
              color: "#C53030",
            },
          },
        }}
      />

      {/* First-login modal */}
      {showFirstLogin && <FirstLoginModal onClose={markFirstLoginSeen} />}

      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/registration"
            element={
              <PublicRoute>
                <Registration />
              </PublicRoute>
            }
          />

          {/* User dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Admin dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Catch-all route */}
          <Route
            path="*"
            element={
              !currentUser ? (
                <Navigate to="/" replace />
              ) : currentUser.role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
