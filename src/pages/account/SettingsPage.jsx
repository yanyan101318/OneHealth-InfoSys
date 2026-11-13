import { useState } from 'react'
import {
  Settings,
  Bell,
  Moon,
  Shield,
  Sparkles,
  Server,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Smartphone,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { seedFirestoreDatabase } from '../../lib/seedFirebase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../context/NotificationContext'
import useAppStore from '../../store/useAppStore'
import PageHeader from '../../components/layout/PageHeader'

export default function SettingsPage() {
  const { setShowWhatsNew, CURRENT_VERSION } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  const [isSeeding, setIsSeeding] = useState(false)

  // Notification Preferences
  const [prefs, setPrefs] = useState({
    emailNotifs: true,
    smsAlerts: false,
    pushNotifs: true,
    autoSyncAlerts: true,
  })

  const handleToggle = (key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      toast.success('Notification preferences updated')
      return next
    })
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    try {
      const res = await seedFirestoreDatabase(true)
      if (res.success) {
        toast.success('Successfully populated Firestore with sample Yakap clinical records!')
      } else {
        toast.error('Failed to seed: ' + res.error)
      }
    } catch (err) {
      toast.error('Seeding error: ' + err.message)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleResetVersionCheck = () => {
    try {
      localStorage.removeItem('lastSeenVersion')
      toast.success('lastSeenVersion cleared from localStorage. The What\'s New popup will trigger on next login!')
    } catch (e) {
      toast.error('Failed to clear localStorage')
    }
  }

  const unreadAlerts = notifications ? notifications.filter((n) => !n.read) : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Configure notifications, alerts, and application preferences"
        icon={Settings}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Actionable Alerts (Badge Items) */}
        <Card className="bg-white border-slate-200 md:col-span-2 dark:bg-[#1e293b] dark:border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">Actionable System Alerts</CardTitle>
              </div>
              {unreadAlerts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {unreadAlerts.length} Unresolved
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={markAllAsRead}
                    className="h-7 text-xs text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all resolved
                  </Button>
                </div>
              )}
            </div>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Immediate actions required across cloud synchronization and clinical guidelines
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0 dark:bg-slate-800 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Pending PhilHealth Batch Sync</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">47 patient records are waiting to push to e-Claims central servers.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => toast.success('Sync triggered from settings')}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 ml-2"
                >
                  Sync Now
                </Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0 dark:bg-slate-800 dark:text-slate-400">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">PhilHealth Konsulta v2.3.4 Update</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">New primary care package billing codes have been published for 2024.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWhatsNew(true)}
                  className="h-8 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shrink-0 ml-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  View Release
                </Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0 dark:bg-slate-800 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">New Screening Guidelines Active</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Cardiovascular risk and hypertension screening forms updated according to DOH memo.</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 ml-2 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  Compliant
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Notification Preferences */}
        <Card className="bg-white border-slate-200 dark:bg-[#1e293b] dark:border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Notification Preferences</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Configure communication channels for critical health alerts
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-200">Email Notifications</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">Daily digest of registered Yakap patients and sync logs</p>
              </div>
              <Switch checked={prefs.emailNotifs} onCheckedChange={() => handleToggle('emailNotifs')} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-200">SMS / Text Alerts</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">Instant text alert for queue emergencies and counter calls</p>
              </div>
              <Switch checked={prefs.smsAlerts} onCheckedChange={() => handleToggle('smsAlerts')} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-200">Push Notifications</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">Browser desktop banners for real-time ticket calls</p>
              </div>
              <Switch checked={prefs.pushNotifs} onCheckedChange={() => handleToggle('pushNotifs')} />
            </div>
          </CardContent>
        </Card>

        {/* 3. Theme & App Specifications */}
        <Card className="bg-white border-slate-200 dark:bg-[#1e293b] dark:border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">Display Theme & Version</CardTitle>
              </div>
              <Badge className="bg-blue-600 text-white font-mono text-xs">
                {CURRENT_VERSION}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Active design system and version manifest
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Current Theme:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Color Palette:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {theme === 'dark' ? 'Deep Slate (#0f172a, #1e293b)' : 'Clean Slate (Light #ffffff, #f8fafc)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Release Build:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">Build 2024.11.12</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetVersionCheck}
                className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Reset What's New Trigger (Test Login Popup)
              </Button>

              <Button
                size="sm"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
              >
                <Database className="w-3.5 h-3.5" />
                {isSeeding ? 'Seeding Database...' : 'Populate Sample Firestore Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
