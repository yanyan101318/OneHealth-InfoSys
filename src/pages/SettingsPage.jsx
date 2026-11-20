import { useState } from 'react'
import {
  Database,
  RefreshCw,
  Shield,
  User,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { seedFirestoreDatabase } from '../lib/seedFirebase'
import { useAuth } from '../context/AuthContext'
import { app } from '../lib/firebase'

export default function SettingsPage() {
  const { currentUser, userProfile, setShowWhatsNew, CURRENT_VERSION } = useAuth()
  const [isSeeding, setIsSeeding] = useState(false)

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    try {
      const res = await seedFirestoreDatabase(true)
      if (res.success) {
        toast.success('Successfully populated Firestore with sample Yakap data!')
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
      toast.success('lastSeenVersion cleared from localStorage! On next login, What\'s New will show.')
    } catch (e) {
      toast.error('Failed to clear localStorage')
    }
  }

  const handleOpenWhatsNew = () => {
    setShowWhatsNew(true)
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          System Settings & Database Administration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Firebase Cloud backend, view authenticated profile, and manage data seeding.
        </p>
      </div>

      {/* Firebase Status Card */}
      <Card className="bg-[#1e293b] border-slate-700">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-base text-slate-100">Firebase Backend Connection</CardTitle>
            </div>
            <Badge variant="success" className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected (philhealth-acf09)
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Real-time synchronization with Google Cloud Firestore & Firebase Auth
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Project ID</span>
              <span className="font-mono font-semibold text-slate-200">philhealth-acf09</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Storage Bucket</span>
              <span className="font-mono font-semibold text-slate-200">philhealth-acf09.firebasestorage.app</span>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Sample Data Seeding
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Clicking below populates Firestore collections (<code>facilities</code>, <code>patients</code>, <code>philhealth_members</code>, <code>sync_logs</code>) with sample Yakap clinical records.
            </p>
            <Button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2"
            >
              <Database className="w-4 h-4" />
              {isSeeding ? 'Seeding Database...' : 'Populate / Reset Sample Firestore Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Profile Card */}
      <Card className="bg-[#1e293b] border-slate-700">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-base text-slate-100">Authenticated Health Worker</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Name</span>
              <span className="font-semibold text-slate-200">
                {userProfile?.name || currentUser?.displayName || 'Maria Santos'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Role / Designation</span>
              <span className="font-semibold text-slate-200">{userProfile?.role || 'Health Worker'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Assigned Facility</span>
              <span className="font-semibold text-slate-200 truncate block">
                {userProfile?.facility || 'Barangay Health Center - Poblacion'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version & What's New Controls Card */}
      <Card className="bg-[#1e293b] border-slate-700">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-base text-slate-100">Release Version & "What's New" Testing</CardTitle>
            </div>
            <Badge className="bg-blue-600 text-white font-mono text-xs">
              {CURRENT_VERSION}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenWhatsNew}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Preview "What's New" Modal
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetVersionCheck}
              className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Clear lastSeenVersion (Test Login Trigger)
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Testing flow: Click "Clear lastSeenVersion" → Logout → Login → Verify popup appears → Close → Logout → Login again → Verify popup does NOT appear.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
