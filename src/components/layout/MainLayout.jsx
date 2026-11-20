import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import WhatsNewModal from '../modals/WhatsNewModal'
import LockScreen from '../auth/LockScreen'
import { useAuth } from '../../context/AuthContext'
import useInactivityTimer from '../../hooks/useInactivityTimer'
import { LayoutProvider, useLayout } from '../../context/LayoutContext'

function MainLayoutContent() {
  const { isSidebarOpen } = useLayout()
  const { currentUser, isLocked, setIsLocked } = useAuth()
  useInactivityTimer({
    enabled: Boolean(currentUser) && !isLocked,
    isLocked,
    setIsLocked,
  })

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* WhatsNewModal only opens if isModalOpen was set to true on successful login */}
      <WhatsNewModal />
      <Navbar />
      {isSidebarOpen && <Sidebar />}
      <main className="min-w-0 flex-1 overflow-auto pt-16 transition-all duration-300 ease-in-out">
        <div className="w-full max-w-none space-y-6 bg-background px-4 pb-6 pt-6 sm:px-6 sm:pb-8 lg:px-8">
          <Outlet />
        </div>
      </main>
      <LockScreen />
    </div>
  )
}

export default function MainLayout() {
  return (
    <LayoutProvider>
      <MainLayoutContent />
    </LayoutProvider>
  )
}
