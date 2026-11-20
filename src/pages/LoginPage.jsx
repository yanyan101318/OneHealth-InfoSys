import { useState } from 'react'
import { Eye, EyeOff, Shield, Activity, ArrowRight, Lock, Mail } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../lib/dashboardRoute'
import bagongPilipinasLogo from '../assets/bagong-pilipinas-logo.png'
import southCotabatoLogo from '../assets/south-cotabato-logo.png'

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('msantos@onehealth.gov.ph')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { user, loading, login, setShowWhatsNew, userProfile } = useAuth()
  const navigate = useNavigate()

  if (!loading && user) {
    return <Navigate to={getDashboardPath(userProfile?.role)} replace />
  }

  if (loading) return null

  async function handleLoginSuccess(res) {
    // Exact version check logic inside handleLoginSuccess (auth callback)
    const CURRENT_VERSION = "v2.3.4"
    const lastSeen = localStorage.getItem("lastSeenVersion")
    const shouldShow = lastSeen !== CURRENT_VERSION

    if (shouldShow) {
      setShowWhatsNew(true)
    }

    console.log("Version check:", {
      lastSeen,
      current: CURRENT_VERSION,
      shouldShow
    })

    const displayName = res?.profile?.name || 'Maria Santos'
    toast.success(`Welcome back, ${displayName}!`)
    navigate(getDashboardPath(res?.profile?.role))
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!emailOrUsername || !password) {
      toast.error('Please enter email/username and password')
      return
    }

    setIsLoading(true)
    try {
      // Normalize email format for Firebase Auth
      const formattedEmail = emailOrUsername.includes('@')
        ? emailOrUsername.trim()
        : `${emailOrUsername.trim().toLowerCase()}@onehealth.gov.ph`

      const res = await login(formattedEmail, password)
      if (res?.isDevSession) {
        toast.info('Signed in! (Enable "Email/Password" in Firebase Console for production cloud auth)')
      }
      await handleLoginSuccess(res)
    } catch (err) {
      console.error('Login error:', err)
      const errorMsg =
        err.code === 'auth/invalid-credential'
          ? 'Invalid credentials. Please verify your email and password.'
          : err.code === 'auth/network-request-failed'
          ? 'Network connection error. Check your internet connectivity.'
          : err.message || 'Login failed'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Left Panel - Login Form */}
      <div className="relative flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 max-w-xl mx-auto lg:mx-0 w-full">
        {/* Brand / Logo */}
        <div className="mb-8">
          <div className="mb-8 flex w-full items-center justify-between px-2">
            <img
              src={bagongPilipinasLogo}
              alt="Bagong Pilipinas"
              className="h-14 w-auto object-contain drop-shadow-lg"
            />
            <div className="min-w-0 flex-1 px-3 text-center">
              <h1 className="whitespace-nowrap text-lg font-bold tracking-wide text-white sm:text-xl">
                OneHealth InfoSys
              </h1>
              <p className="text-xs text-slate-400">Sistemang Pangkalusugan (SCOHIS / Yakap)</p>
            </div>
            <img
              src={southCotabatoLogo}
              alt="South Cotabato Official Seal"
              className="h-14 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400">Sign in to your Yakap health center account.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername" className="text-slate-300">
              Email or Username
            </Label>
            <div className="relative">
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="e.g. msantos@onehealth.gov.ph or msantos"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                autoComplete="username"
                className="pl-10"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pl-10 pr-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-400">Remember session</span>
            </label>
            <button
              type="button"
              onClick={() => toast.info('Password recovery link sent to registered supervisor email')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Sign In to Yakap <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>

          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 text-xs text-slate-400 space-y-1">
            <span className="text-blue-400 font-medium">Demo Credentials:</span>
            <div className="flex flex-col gap-1 mt-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Admin:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmailOrUsername('admin@onehealth.gov.ph')
                    setPassword('password123')
                  }}
                  className="font-mono text-slate-300 hover:text-white transition-colors"
                >
                  admin@onehealth.gov.ph / password123
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Health Worker:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmailOrUsername('msantos@onehealth.gov.ph')
                    setPassword('password123')
                  }}
                  className="font-mono text-slate-300 hover:text-white transition-colors"
                >
                  msantos@onehealth.gov.ph / password123
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-8 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">PhilHealth & DOH Accredited</span>
          </div>
          <p className="text-xs text-slate-500">
            Authorized personnel only. Data privacy protected under Republic Act No. 10173.
          </p>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-950/60 via-[#0f172a] to-slate-900 items-center justify-center overflow-hidden">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative blur elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center px-8">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <Activity className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Integrated<br />
            <span className="text-blue-400">Yakap</span> Health Information<br />
            System
          </h2>
          <p className="text-slate-400 text-base mb-8 leading-relaxed">
            Universal Health Care primary care consultations, patient profiling, and real-time PhilHealth e-claims synchronization.
          </p>

          {/* Operational highlight */}
          <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase text-blue-400">System Status</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live & Operational
              </span>
            </div>
            <p className="text-slate-300 text-xs italic">
              "Ensuring every registered Filipino family has direct access to primary care consultations and essential health packages."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
