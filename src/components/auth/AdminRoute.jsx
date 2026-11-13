import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import { useRef } from 'react'

/**
 * AdminRoute — wraps /admin/* routes.
 * Allows access only when userProfile.role === 'admin'.
 * Non-admins are redirected to /dashboard with a toast.
 */
export function AdminOnlyRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth()
  const toastedRef = useRef(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Verifying permissions...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const role = userProfile?.role?.toLowerCase()
  if (role !== 'admin') {
    if (!toastedRef.current) {
      toastedRef.current = true
      // Delay toast slightly to avoid calling during render
      setTimeout(() => toast.error('Access Denied: Admin privileges required.'), 50)
    }
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default AdminOnlyRoute
