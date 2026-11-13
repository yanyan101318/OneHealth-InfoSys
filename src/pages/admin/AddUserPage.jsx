import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { toast } from 'sonner'
import {
  UserPlus,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Building2,
  ShieldCheck,
  IdCard,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import PageHeader from '../../components/layout/PageHeader'

const ROLES = ['Admin', 'Physician', 'Health Worker', 'Encoder']
const FACILITIES = [
  'Barangay Health Center - Poblacion',
  'Barangay Health Center - Sta. Cruz',
  'Barangay Health Center - San Isidro',
  'Rural Health Unit - Main',
  'Rural Health Unit - North',
  'Municipal Health Office',
]

export default function AddUserPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    tempPassword: '',
    role: 'Health Worker',
    facility: FACILITIES[0],
    philhealthAccredId: '',
  })

  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.tempPassword) e.tempPassword = 'Temporary password is required.'
    else if (form.tempPassword.length < 8) e.tempPassword = 'Password must be at least 8 characters.'
    if (!form.role) e.role = 'Role is required.'
    if (!form.facility) e.facility = 'Facility is required.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.tempPassword)
      const newUser = cred.user

      // 2. Create Firestore user profile
      await setDoc(doc(db, 'users', newUser.uid), {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        facility: form.facility,
        facilityId: form.facility.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        philhealthAccredId: form.philhealthAccredId.trim() || null,
        status: 'active',
        requiresPasswordChange: true,     // force reset on first login
        createdAt: serverTimestamp(),
        lastSeenVersion: null,
      })

      toast.success(`User "${form.fullName}" created successfully.`)
      toast.info('They will be prompted to change their password on first login.')
      navigate('/admin/users')
    } catch (err) {
      console.error('Create user error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already registered.' })
      } else if (err.code === 'auth/configuration-not-found') {
        toast.error('Firebase Auth is not yet enabled. Enable Email/Password provider in Firebase Console.')
      } else if (err.code === 'auth/weak-password') {
        setErrors({ tempPassword: 'Password is too weak. Use at least 8 characters.' })
      } else {
        toast.error(err.message || 'Failed to create user.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to User Management
        </button>
        <PageHeader
          title="Add New User"
          subtitle="Create a health worker account with a temporary password"
          icon={UserPlus}
        />
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 space-y-5"
      >
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
          </Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="e.g. Maria Santos"
            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
          {errors.fullName && <p className="text-xs text-red-400">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. msantos@onehealth.gov.ph"
            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 font-mono"
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>

        {/* Temp Password */}
        <div className="space-y-1.5">
          <Label htmlFor="tempPassword" className="text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" /> Temporary Password
          </Label>
          <div className="relative">
            <Input
              id="tempPassword"
              type={showPassword ? 'text' : 'password'}
              value={form.tempPassword}
              onChange={(e) => set('tempPassword', e.target.value)}
              placeholder="Minimum 8 characters"
              className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.tempPassword && <p className="text-xs text-red-400">{errors.tempPassword}</p>}
          <p className="text-xs text-slate-500">
            The user will be required to change this on first login.
          </p>
        </div>

        {/* Role + Facility side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Role
            </Label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-400">{errors.role}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="facility" className="text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Facility
            </Label>
            <select
              id="facility"
              value={form.facility}
              onChange={(e) => set('facility', e.target.value)}
              className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {FACILITIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            {errors.facility && <p className="text-xs text-red-400">{errors.facility}</p>}
          </div>
        </div>

        {/* PhilHealth Accreditation ID (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="philhealthAccredId" className="text-slate-300 flex items-center gap-1.5">
            <IdCard className="w-3.5 h-3.5 text-slate-400" /> PhilHealth Accreditation ID{' '}
            <span className="text-slate-500 text-xs font-normal">(Optional)</span>
          </Label>
          <Input
            id="philhealthAccredId"
            value={form.philhealthAccredId}
            onChange={(e) => set('philhealthAccredId', e.target.value)}
            placeholder="e.g. PHA-2024-00123"
            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 font-mono"
          />
        </div>

        {/* Info box */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">What happens next?</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>A Firebase Auth account is created with the temporary password.</li>
            <li>A Firestore profile is created under <code className="text-slate-300">users/{'{uid}'}</code>.</li>
            <li>On first login, the user will be forced to change their password.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/users')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create User Account
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
