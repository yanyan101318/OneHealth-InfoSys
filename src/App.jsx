import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import ECGLoadingScreen from './components/layout/ECGLoadingScreen'

import { getDashboardPath } from './lib/dashboardRoute'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const YakapDashboard = lazy(() => import('./pages/yakap/YakapDashboard'))
const YakapModule = lazy(() => import('./pages/yakap/YakapModule'))
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/account/SettingsPage'))
const CounterPage = lazy(() => import('./pages/account/CounterPage'))
const QueueGeneratePage = lazy(() => import('./pages/account/QueueGeneratePage'))
const QueueManagementPage = lazy(() => import('./pages/account/QueueManagementPage'))
const ChangePasswordPage = lazy(() => import('./pages/account/ChangePasswordPage'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const AddUserPage = lazy(() => import('./pages/admin/AddUserPage'))

function RouteLoadingFallback() {
  return (
    <ECGLoadingScreen pageName="page" visible />
  )
}

function getPageName(pathname) {
  const routeNames = {
    '/dashboard': 'Dashboard',
    '/yakap/dashboard': 'Yakap Dashboard',
    '/yakap/registered': 'Registered Patients',
    '/yakap/philhealth': 'PhilHealth Master List',
    '/yakap/member-check': 'Member Check',
    '/yakap/upload': 'XML Upload',
    '/yakap/reports': 'Reports',
    '/account/profile': 'Profile',
    '/account/settings': 'Settings',
    '/account/counter': 'Queue Counter',
    '/account/queue-generate': 'Queue Generator',
    '/account/queue-management': 'Queue Management',
    '/account/change-password': 'Change Password',
    '/admin/users': 'User Management',
    '/admin/users/new': 'Add User',
    '/login': 'Login',
  }
  if (routeNames[pathname]) return routeNames[pathname]
  if (pathname.startsWith('/yakap/')) return 'Yakap'
  return 'page'
}

function AppRoutes() {
  const { currentUser, loading, userProfile } = useAuth()
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const [loadingRoute, setLoadingRoute] = useState(null)

  useEffect(() => {
    if (previousPath.current === location.pathname) return undefined
    previousPath.current = location.pathname
    setLoadingRoute({ pageName: getPageName(location.pathname), visible: true })

    const hideTimer = window.setTimeout(() => {
      setLoadingRoute((current) => current && { ...current, visible: false })
    }, 850)
    const clearTimer = window.setTimeout(() => setLoadingRoute(null), 1150)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [location.pathname])

  if (loading) {
    return <ECGLoadingScreen pageName="OneHealth InfoSys" visible />
  }

  return (
    <>
      <Suspense fallback={<RouteLoadingFallback />}>
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
          <Route path="admin" element={<AdminRoute />}>
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
      </Suspense>
      {loadingRoute && (
        <ECGLoadingScreen
          pageName={loadingRoute.pageName}
          visible={loadingRoute.visible}
        />
      )}
    </>
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
