import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

const MAXIMIZED_STORAGE_KEY = 'isMaximized'
const LayoutContext = createContext(null)

function readMaximizedState() {
  try {
    return sessionStorage.getItem(MAXIMIZED_STORAGE_KEY) === 'true'
  } catch (error) {
    console.warn('Unable to read focus mode state:', error)
    return false
  }
}

function readInitialSidebarState() {
  try {
    return (
      sessionStorage.getItem(MAXIMIZED_STORAGE_KEY) !== 'true' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches
    )
  } catch (error) {
    console.warn('Unable to determine initial sidebar state:', error)
    return false
  }
}

export function LayoutProvider({ children }) {
  const [isMaximized, setIsMaximized] = useState(readMaximizedState)
  const [isSidebarOpen, setIsSidebarOpen] = useState(readInitialSidebarState)

  useEffect(() => {
    try {
      if (isMaximized) sessionStorage.setItem(MAXIMIZED_STORAGE_KEY, 'true')
      else sessionStorage.removeItem(MAXIMIZED_STORAGE_KEY)
    } catch (error) {
      console.warn('Unable to persist focus mode state:', error)
    }
  }, [isMaximized])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsMaximized(false)
        setIsSidebarOpen(
          typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
        )
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleMaximized = useCallback(async () => {
    if (!isMaximized) {
      setIsSidebarOpen(false)
      setIsMaximized(true)
      try {
        await document.documentElement.requestFullscreen()
      } catch (error) {
        console.error('Unable to enter fullscreen focus mode:', error)
        toast.error(`Focus mode is enabled, but fullscreen could not be entered: ${error.message}`)
      }
      return
    }

    setIsMaximized(false)
    setIsSidebarOpen(true)
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('Unable to exit fullscreen focus mode:', error)
        toast.error(`Unable to exit fullscreen: ${error.message}`)
      }
    }
  }, [isMaximized])

  return (
    <LayoutContext.Provider
      value={{ isMaximized, toggleMaximized, isSidebarOpen, setIsSidebarOpen }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayout must be used within a LayoutProvider')
  return context
}
