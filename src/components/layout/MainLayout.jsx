import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import WhatsNewModal from '../modals/WhatsNewModal'
import LockScreen from '../auth/LockScreen'
import { useAuth } from '../../context/AuthContext'
import useInactivityTimer from '../../hooks/useInactivityTimer'
import { LayoutProvider, useLayout } from '../../context/LayoutContext'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleChange = (event) => setMatches(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

function MainLayoutContent() {
  const { isMaximized, isSidebarOpen, setIsSidebarOpen } = useLayout()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { currentUser, isLocked, setIsLocked } = useAuth()

  useEffect(() => {
    setIsSidebarOpen(isDesktop && !isMaximized)
  }, [isDesktop, isMaximized, setIsSidebarOpen])

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
      {isSidebarOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {isSidebarOpen && (
        <Sidebar isMobile={!isDesktop} onClose={() => setIsSidebarOpen(false)} />
      )}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto pt-16">
          <div className="w-full max-w-none space-y-6 bg-background px-3 pb-6 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <Outlet />
          </div>
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
