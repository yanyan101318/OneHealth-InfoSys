import { useEffect, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-react'
import { addDoc, collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { toast } from 'sonner'
import PageHeader from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Switch } from '../../components/ui/switch'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { db } from '../../lib/firebase'
import { getFacilityFilter, isAdminUser } from '../../lib/facilityAccess'

const preferenceOptions = [
  {
    key: 'emailNotifs',
    label: 'Email notifications',
    description: 'Receive important account and service updates by email.',
  },
  {
    key: 'autoSyncAlerts',
    label: 'Synchronization alerts',
    description: 'Show an in-app alert when record synchronization needs attention.',
  },
]

function formatAlertDate(timestamp) {
  if (!timestamp) return 'Recently'
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString()
}

export default function SettingsPage() {
  const { currentUser, userProfile, setShowWhatsNew, CURRENT_VERSION } = useAuth()
  const { notifications } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const [preferences, setPreferences] = useState(userProfile?.preferences || {})
  const [savingPreference, setSavingPreference] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setPreferences(userProfile?.preferences || {})
  }, [userProfile?.preferences])

  const savePreference = async (key, value) => {
    if (!currentUser?.uid) {
      toast.error('You must be signed in to save preferences.')
      return
    }

    setSavingPreference(key)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { [`preferences.${key}`]: value })
      setPreferences((current) => ({ ...current, [key]: value }))
      toast.success('Notification preference saved.')
    } catch (error) {
      console.error(`Failed to save ${key} preference:`, error)
      toast.error(`Unable to save preference: ${error.message}`)
    } finally {
      setSavingPreference(null)
    }
  }

  const syncPendingRecords = async () => {
    if (!currentUser?.uid) {
      toast.error('You must be signed in to synchronize records.')
      return
    }

    const canSyncAllFacilities = isAdminUser(userProfile)
    if (!canSyncAllFacilities && !userProfile?.facilityId) {
      toast.error('No assigned facility is available for synchronization.')
      return
    }

    setIsSyncing(true)
    try {
      const patientsRef = collection(db, 'patients')
      const facilityFilter = getFacilityFilter(userProfile)
      const patientQueries = canSyncAllFacilities
        ? [query(patientsRef, where('synced', '==', false))]
        : [query(patientsRef, facilityFilter, where('synced', '==', false))]
      const snapshots = await Promise.all(patientQueries.map((patientQuery) => getDocs(patientQuery)))
      const scopedRecords = [
        ...new Map(snapshots.flatMap((snapshot) => snapshot.docs).map((patient) => [patient.id, patient])).values(),
      ]
      const pendingRecords = scopedRecords.filter((patient) => patient.data().synced === false)

      for (let offset = 0; offset < pendingRecords.length; offset += 499) {
        const batch = writeBatch(db)
        pendingRecords.slice(offset, offset + 499).forEach((patient) => {
          batch.update(patient.ref, { synced: true, syncedAt: new Date().toISOString() })
        })
        await batch.commit()
      }

      await addDoc(collection(db, 'sync_logs'), {
        userId: currentUser.uid,
        ...(userProfile?.facilityId ? { facilityId: userProfile.facilityId } : {}),
        timestamp: new Date().toISOString(),
        recordsSynced: pendingRecords.length,
        status: 'success',
        source: 'settings',
      })
      toast.success(
        pendingRecords.length
          ? `${pendingRecords.length} record${pendingRecords.length === 1 ? '' : 's'} synchronized in the system.`
          : 'No pending records to synchronize.'
      )
    } catch (error) {
      console.error('Record synchronization failed:', error)
      toast.error(`Synchronization failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const resetWhatsNew = async () => {
    try {
      localStorage.removeItem('lastSeenVersion')
      if (currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), { lastSeenVersion: null })
      }
      setShowWhatsNew(true)
      toast.success("What's New has been reopened.")
    } catch (error) {
      console.error("Failed to reset What's New:", error)
      toast.error(`Unable to reset What's New: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Manage your appearance and notification preferences"
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">System alerts</CardTitle>
            <CardDescription>Updates and notices for your account.</CardDescription>
          </div>
          <Button variant="outline" onClick={syncPendingRecords} disabled={isSyncing}>
            {isSyncing ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? 'Syncing…' : 'Sync now'}
          </Button>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">All systems operational. No new alerts.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li key={notification.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{notification.title || 'System alert'}</p>
                    {notification.message && (
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    )}
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatAlertDate(notification.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Notification preferences</CardTitle>
            <CardDescription>Choose which updates are associated with your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {preferenceOptions.map((option) => (
              <div key={option.key} className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <Switch
                  checked={preferences[option.key] ?? true}
                  onCheckedChange={(checked) => savePreference(option.key, checked)}
                  disabled={savingPreference !== null}
                  aria-label={option.label}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Set the display theme for this device.</CardDescription>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {CURRENT_VERSION}
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Current theme</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle dark mode"
              />
            </div>
            <div className="border-t border-border pt-4">
              <Button variant="outline" onClick={resetWhatsNew}>
                Reset What&apos;s New notice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
