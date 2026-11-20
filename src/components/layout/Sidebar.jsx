import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Heart,
  Settings,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Search,
  Upload,
  FileSpreadsheet,
  Users,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

/**
 * Sidebar Navigation
 * 1. Dashboard (Top-level standalone analytics module)
 * 2. Yakap (Parent menu with sub-routes: Registered, PhilHealth List, Member Check, Upload, Reports)
 * 3. Settings (Top-level configuration)
 */
const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    end: true,
  },
  {
    label: 'Yakap',
    icon: Heart,
    to: '/yakap',
    children: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/yakap/dashboard' },
      { label: 'Registered', icon: UserCheck, to: '/yakap/registered' },
      { label: 'PhilHealth List', icon: ShieldCheck, to: '/yakap/philhealth' },
      { label: 'Member Check', icon: Search, to: '/yakap/member-check' },
      { label: 'Upload', icon: Upload, to: '/yakap/upload' },
      { label: 'Reports', icon: FileSpreadsheet, to: '/yakap/reports' },
    ],
  },
  {
    label: 'User Management',
    icon: Users,
    to: '/admin/users',
    adminOnly: true,
  },
  {
    label: 'Settings',
    icon: Settings,
    to: '/account/settings',
    end: true,
  },
]

function NavItem({ item, collapsed, onNavigate }) {
  const location = useLocation()
  const [expanded, setExpanded] = useState(true) // Yakap starts expanded

  const isParentActive = item.children
    ? location.pathname.startsWith(item.to)
    : (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))

  if (item.children) {
    const open = expanded || isParentActive

    return (
      <div>
        <div
          className={cn(
            'w-full flex items-center rounded-lg text-sm font-medium transition-colors',
            isParentActive
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          {/* Clicking Yakap navigates directly to /yakap (redirects to /yakap/registered) */}
          <NavLink
            to={item.to}
            onClick={() => {
              setExpanded(true)
              onNavigate()
            }}
            className="flex-1 flex items-center gap-3 px-3 py-2.5"
          >
            <item.icon className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
            {!collapsed && (
              <>
                <span className="flex-1 whitespace-nowrap text-left font-semibold">{item.label}</span>
                {item.badge && (
                  <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>

          {!collapsed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((prev) => !prev)
              }}
              className="p-2 text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Toggle sub-menu"
            >
              <ChevronRight
                className={cn('w-4 h-4 transition-transform duration-200', open && 'rotate-90')}
              />
            </button>
          )}
        </div>

        {/* Sub-items (Registered, PhilHealth List, Member Check, Upload, Reports) */}
        {!collapsed && open && (
          <div className="mt-1 ml-9 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-700">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )
                }
              >
                {child.icon && <child.icon className="w-4 h-4 flex-shrink-0" />}
                <span className="whitespace-nowrap">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Collapsed view tooltips */}
        {collapsed && (
          <div className="mt-1 space-y-0.5">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                title={child.label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center w-10 h-9 mx-auto rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  )
                }
              >
                {child.icon && <child.icon className="w-4 h-4" />}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Standalone Top-Level Items: Dashboard & Settings
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          collapsed && 'justify-center w-10 h-10 mx-auto px-0',
          isActive
            ? 'bg-blue-600 text-white shadow-sm font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        )
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ isMobile = false, onClose = () => {} }) {
  const { userProfile } = useAuth()
  const collapsed = false
  const isAdmin = userProfile?.role?.toLowerCase() === 'admin'

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={cn(
        'z-40 flex w-64 min-w-[16rem] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        isMobile
          ? 'fixed bottom-0 left-0 top-16 h-auto shadow-2xl'
          : 'relative h-screen pt-16'
      )}
    >
        {/* Navigation list */}
        <nav className="flex-1 px-2 space-y-1.5 overflow-y-auto py-3">
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={() => {
                if (isMobile) onClose()
              }}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto shrink-0 border-t border-slate-200 px-4 py-3 dark:border-slate-700/50">
          <p className="whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">OneHealth InfoSys</p>
          <p className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">v2.3.4 · Build 2024.11</p>
        </div>
    </aside>
  )
}
