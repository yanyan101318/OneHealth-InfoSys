import { create } from 'zustand'

export const CURRENT_APP_VERSION = 'v2.3.4'
const VERSION_STORAGE_KEY = 'lastSeenVersion'

const useAppStore = create((set, get) => ({
  // App Version & What's New State
  appVersion: CURRENT_APP_VERSION,
  isModalOpen: false,
  showWhatsNew: false, // alias for isModalOpen

  setIsModalOpen: (open) => set({ isModalOpen: open, showWhatsNew: open }),

  // Manual trigger if needed
  openWhatsNew: () => set({ isModalOpen: true, showWhatsNew: true }),

  // Atomically log in and optionally show the What's New modal in one Zustand update.
  // This prevents a split-render race where isAuthenticated=true renders MainLayout
  // before isModalOpen=true is applied.
  loginAndCheckVersion: (user) => {
    const lastSeen = localStorage.getItem(VERSION_STORAGE_KEY)
    const shouldShow = lastSeen !== CURRENT_APP_VERSION
    console.log('Version check:', {
      lastSeen,
      current: CURRENT_APP_VERSION,
      shouldShow,
    })
    set({
      isAuthenticated: true,
      isModalOpen: shouldShow,
      showWhatsNew: shouldShow,
      user: { id: 1, ...user },
      userSession: { id: 1, lastLogin: new Date().toISOString(), ...user },
    })
  },

  // Dismiss and persist to localStorage immediately
  dismissWhatsNew: () => {
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_APP_VERSION)
    } catch {
      // ignore
    }
    set({ isModalOpen: false, showWhatsNew: false })
  },

  // User Session Management
  userSession: {
    id: 1,
    name: 'Maria Santos',
    username: 'msantos',
    role: 'Health Worker',
    facility: 'Barangay Health Center - Poblacion',
    avatar: null,
    lastLogin: new Date().toISOString(),
  },
  user: {
    id: 1,
    name: 'Maria Santos',
    username: 'msantos',
    role: 'Health Worker',
    facility: 'Barangay Health Center - Poblacion',
    avatar: null,
  },
  isAuthenticated: false,
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setUser: (user) => set({ user, userSession: { ...get().userSession, ...user } }),

  // Layout State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Notifications & Unread Badge Logic
  notifications: [
    { id: 1, text: 'Batch sync completed: 47 records', read: false },
    { id: 2, text: 'PhilHealth Konsulta update available', read: false },
    { id: 3, text: 'New screening guidelines published', read: false },
  ],
  getUnreadNotificationsCount: () => {
    return get().notifications.filter(n => !n.read).length
  },
  addNotification: (notif) => set((state) => ({
    notifications: [{ id: Date.now(), read: false, ...notif }, ...state.notifications]
  })),
  markNotificationsAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  // Operational Filters (Yakap)
  selectedFacility: 'all',
  setSelectedFacility: (facility) => set({ selectedFacility: facility }),
  selectedYear: '2024',
  setSelectedYear: (year) => set({ selectedYear: year }),
}))

export default useAppStore
