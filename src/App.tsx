import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ContentManagement from "./pages/ContentManagement";
import { MemberHome } from "./pages/Member/Home";
import AIAssistant from "./pages/AIAssistant";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";

// Fallback components for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
    {title} ページは準備中です。
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Member Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MemberHome />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin/Staff Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DashboardLayout>
                  <ContentManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DashboardLayout>
                  <Placeholder title="メンバー管理" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIAssistant />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Placeholder title="設定" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}
