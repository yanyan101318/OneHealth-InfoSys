import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import YakapDashboard from './pages/yakap/YakapDashboard'
import YakapModule from './pages/yakap/YakapModule'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

// Account & Queue Management Pages
import ProfilePage from './pages/account/ProfilePage'
import SettingsPage from './pages/account/SettingsPage'
import CounterPage from './pages/account/CounterPage'
import QueueGeneratePage from './pages/account/QueueGeneratePage'
import QueueManagementPage from './pages/account/QueueManagementPage'
import ChangePasswordPage from './pages/account/ChangePasswordPage'

// Admin Pages
import UserManagementPage from './pages/admin/UserManagementPage'
import AddUserPage from './pages/admin/AddUserPage'
import { getDashboardPath } from './lib/dashboardRoute'

function AppRoutes() {
  const { currentUser, loading, requiresPasswordChange, userProfile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading OneHealth...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Route: Login */}
      <Route
        path="/login"
        element={!currentUser ? <LoginPage /> : <Navigate to={getDashboardPath(userProfile?.role)} replace />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Main landing page redirects directly to /dashboard */}
        <Route index element={<Navigate to={getDashboardPath(userProfile?.role)} replace />} />

        {/* Top-level standalone Dashboard route */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="yakap/dashboard" element={<YakapDashboard />} />

        {/* Yakap module routes */}
        <Route path="yakap/*" element={<YakapModule />} />

        {/* Account Module Routes */}
        <Route path="account">
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="counter" element={<CounterPage />} />
          <Route path="queue-generate" element={<QueueGeneratePage />} />
          <Route path="queue-management" element={<QueueManagementPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* Admin Module Routes — admin role only */}
        <Route
          path="admin"
          element={<AdminRoute />}
        >
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/new" element={<AddUserPage />} />
        </Route>

        {/* Direct / Legacy Settings Redirect */}
        <Route path="settings" element={<Navigate to="/account/settings" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={getDashboardPath(userProfile?.role)} replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' },
            }}
          />
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
