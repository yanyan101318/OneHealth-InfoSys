import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U'
}

export default function LockScreen() {
  const { currentUser, userProfile, isLocked, logout, unlockWithPassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email || 'User'

  if (!isLocked || !currentUser) return null

  async function handleUnlock(event) {
    event.preventDefault()
    if (!password) {
      toast.error('Enter your password to unlock this session.')
      return
    }
    setIsUnlocking(true)
    try {
      await unlockWithPassword(password)
      setPassword('')
      toast.success('Session unlocked.')
    } catch (error) {
      console.error('Session unlock failed:', error)
      toast.error(error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password'
        ? 'Incorrect password. Please try again.'
        : `Unable to unlock session: ${error.message}`)
    } finally {
      setIsUnlocking(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout from locked session failed:', error)
      toast.error(`Unable to log out: ${error.message}`)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-screen-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-card-foreground shadow-2xl sm:p-9">
        <div className="flex flex-col items-center text-center">
          <Avatar className="mb-4 h-20 w-20 ring-4 ring-primary/15">
            <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <h1 id="lock-screen-title" className="text-xl font-bold">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {userProfile?.role || 'Signed in user'}
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4" />
            Session locked due to inactivity
          </div>
        </div>

        <form onSubmit={handleUnlock} className="mt-7 space-y-4">
          <label htmlFor="unlock-password" className="block text-sm font-medium">
            Enter your password to continue
          </label>
          <Input
            id="unlock-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            disabled={isUnlocking}
          />
          <Button type="submit" className="w-full" disabled={isUnlocking || !password}>
            {isUnlocking ? 'Verifying...' : 'Unlock'}
          </Button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="mx-auto mt-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Not you? Sign out
        </button>
      </div>
    </div>
  )
}
