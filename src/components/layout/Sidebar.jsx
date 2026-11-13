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
import useAppStore from '../../store/useAppStore'
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

function NavItem({ item, collapsed }) {
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
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
        >
          {/* Clicking Yakap navigates directly to /yakap (redirects to /yakap/registered) */}
          <NavLink
            to={item.to}
            onClick={() => setExpanded(true)}
            className="flex-1 flex items-center gap-3 px-3 py-2.5"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left font-semibold">{item.label}</span>
                {item.badge && (
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-1.5 py-0.5 rounded-full font-mono">
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
              className="p-2 text-slate-400 hover:text-white transition-colors"
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
          <div className="mt-1 ml-9 space-y-0.5 border-l border-slate-700 pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  )
                }
              >
                {child.icon && <child.icon className="w-4 h-4 flex-shrink-0" />}
                <span>{child.label}</span>
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
                title={child.label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center w-10 h-9 mx-auto rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/50'
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
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          collapsed && 'justify-center w-10 h-10 mx-auto px-0',
          isActive
            ? 'bg-blue-600 text-white shadow-sm font-semibold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        )
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar() {
  const { sidebarOpen } = useAppStore()
  const { userProfile } = useAuth()
  const collapsed = !sidebarOpen
  const isAdmin = userProfile?.role?.toLowerCase() === 'admin'

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}

      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-40 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-700/50 transition-all duration-300 overflow-hidden flex flex-col',
          collapsed ? 'w-14' : 'w-64'
        )}
      >
        {/* Navigation list */}
        <nav className="flex-1 px-2 space-y-1.5 overflow-y-auto py-3">
          {visibleNavItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700/50 shrink-0">
            <p className="text-xs text-slate-500 font-medium">OneHealth InfoSys</p>
            <p className="text-xs text-slate-400 dark:text-slate-600">v2.3.4 · Build 2024.11</p>
          </div>
        )}
      </aside>
    </>
  )
}
