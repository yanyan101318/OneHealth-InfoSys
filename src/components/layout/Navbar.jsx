import { useState, useEffect } from 'react'
import {
  Bell,
  Menu,
  Settings,
  User,
  LogOut,
  KeyRound,
  Hash,
  FilePlus,
  Layers,
  ChevronDown,
  Check,
  CheckCheck,
  Clock,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../context/NotificationContext'
import { useLayout } from '../../context/LayoutContext'
import bagongPilipinasLogo from '../../assets/bagong-pilipinas-logo.png'
import southCotabatoLogo from '../../assets/south-cotabato-logo.png'

function formatTimeAgo(isoString) {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffSec = Math.floor((now - date) / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isMaximized, toggleMaximized, isSidebarOpen, setIsSidebarOpen } = useLayout()
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState('')

  // Live Date & Time timer (updates every minute)
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const timePart = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      setCurrentDateTime(`${datePart} • ${timePart}`)
    }

    updateClock()
    const timer = setInterval(updateClock, 60000)
    return () => clearInterval(timer)
  }, [])

  const displayName =
    userProfile?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Maria Santos'
  const displayRole = userProfile?.role || 'Health Worker'
  const displayFacility = userProfile?.facility || 'Barangay Health Center - Poblacion'

  async function handleLogout() {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err) {
      toast.error('Logout error: ' + err.message)
    }
  }

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700/50 flex items-center px-4 gap-3 transition-colors duration-200">
      {/* Left: Mobile/Desktop Toggle + Brand */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen((open) => !open)}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle sidebar"
        aria-expanded={isSidebarOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      <Link to="/dashboard" className="flex shrink-0 items-center gap-3 group">
          <img
            src={bagongPilipinasLogo}
            alt="Bagong Pilipinas"
            className="h-8 w-auto max-w-[42px] shrink-0 object-contain rounded-md dark:bg-white dark:p-0.5"
          />
          <img
            src={southCotabatoLogo}
            alt="South Cotabato Official Seal"
            className="h-8 w-8 shrink-0 object-contain rounded-full dark:bg-white dark:p-0.5"
          />
        <span className="hidden whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white xl:block">
          South Cotabato – One Health Information System
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Header Item: Live Date & Time Display */}
      <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
        <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
        <span>{currentDateTime}</span>
      </div>

      {/* Header Item: Dark / Light Mode Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700 transition-transform hover:-rotate-12" />
        )}
      </button>

      <button
        type="button"
        onClick={toggleMaximized}
        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        title={isMaximized ? 'Minimize' : 'Maximize'}
        aria-label={isMaximized ? 'Minimize' : 'Maximize'}
      >
        {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>

      {/* Header Item: Notifications Popover */}
      <Popover
        open={showNotifMenu}
        onOpenChange={(open) => {
          setShowNotifMenu(open)
          // When opening the panel, automatically mark all as read
          if (open && unreadCount > 0) {
            markAllAsRead()
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* The red badge only appears if unreadCount > 0 */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/50">
                {unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-84 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-0 shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                Notifications
              </span>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors flex items-start gap-2.5 ${
                    !n.read
                      ? 'bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {n.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : n.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                        {n.title || n.text}
                      </p>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {n.message && (
                      <p className="text-slate-600 dark:text-slate-400 leading-snug text-[11px]">
                        {n.message}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                      {formatTimeAgo(n.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No notifications right now.</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* User Avatar Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700">
              <AvatarFallback className="text-xs bg-blue-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-none">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-1">
                {displayRole}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="px-2.5 py-2">
            <div className="font-semibold text-slate-900 dark:text-slate-200 text-sm leading-tight">
              {displayName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate">
              {displayFacility}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />

          {/* 1. Profile */}
          <DropdownMenuItem asChild>
            <Link
              to="/account/profile"
              className="flex items-center px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
            >
              <User className="mr-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          {/* 2. Settings */}
          <DropdownMenuItem asChild>
            <Link
              to="/account/settings"
              className="flex items-center px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
            >
              <Settings className="mr-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="flex-1">Settings</span>
              {unreadCount > 0 && (
                <span className="ml-auto text-[10px] h-4 px-1.5 font-mono rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />

          {/* 3. Counter */}
          <DropdownMenuItem asChild>
            <Link
              to="/account/counter"
              className="flex items-center px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
            >
              <Hash className="mr-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Counter</span>
            </Link>
          </DropdownMenuItem>

          {/* 4. Queue Generate */}
          <DropdownMenuItem asChild>
            <Link
              to="/account/queue-generate"
              className="flex items-center px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
            >
              <FilePlus className="mr-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Queue Generate</span>
            </Link>
          </DropdownMenuItem>

          {/* 5. Queue Management */}
          <DropdownMenuItem asChild>
            <Link
              to="/account/queue-management"
              className="flex items-center px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
            >
              <Layers className="mr-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Queue Management</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />

          {/* 6. Change Password */}
          <DropdownMenuItem asChild>
            <Link
              to="/account/change-password"
              className="flex items-center px-2.5 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs cursor-pointer"
            >
              <KeyRound className="mr-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>Change Password</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />

          {/* 7. Logout */}
          <DropdownMenuItem
            className="px-2.5 py-2 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 text-xs cursor-pointer font-medium"
            onClick={handleLogout}
          >
            <LogOut className="mr-2.5 h-4 w-4 text-rose-500" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
