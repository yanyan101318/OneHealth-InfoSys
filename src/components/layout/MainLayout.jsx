import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import WhatsNewModal from '../modals/WhatsNewModal'
import LockScreen from '../auth/LockScreen'
import { useAuth } from '../../context/AuthContext'
import useInactivityTimer from '../../hooks/useInactivityTimer'
import useAppStore from '../../store/useAppStore'
import { cn } from '../../lib/utils'

export default function MainLayout() {
  const { sidebarOpen } = useAppStore()
  const { currentUser, isLocked, setIsLocked } = useAuth()
  useInactivityTimer({
    enabled: Boolean(currentUser) && !isLocked,
    isLocked,
    setIsLocked,
  })

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* WhatsNewModal only opens if isModalOpen was set to true on successful login */}
      <WhatsNewModal />
      <Navbar />
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300 pt-16 min-h-screen',
          sidebarOpen ? 'ml-64' : 'ml-14'
        )}
      >
        <div className="space-y-6 bg-background px-4 pb-6 pt-6 sm:px-6 sm:pb-8 lg:px-8">
          <Outlet />
        </div>
      </main>
      <LockScreen />
    </div>
  )
}
