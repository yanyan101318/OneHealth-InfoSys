import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  ShieldCheck,
  Stethoscope,
  User,
  KeyRound,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Lock,
  Trash2,
  X,
  Save,
  IdCard,
  Mail,
} from 'lucide-react'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import PageHeader from '../../components/layout/PageHeader'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../../components/ui/dropdown-menu'

const ROLES = ['Admin', 'Physician', 'Health Worker', 'Encoder']
const FACILITIES = [
  'Barangay Health Center - Poblacion',
  'Barangay Health Center - Sta. Cruz',
  'Barangay Health Center - San Isidro',
  'Rural Health Unit - Main',
  'Rural Health Unit - North',
  'Municipal Health Office',
]

// Role badge helper
function RoleBadge({ role }) {
  const map = {
    admin: { icon: ShieldCheck, label: 'Admin' },
    physician: { icon: Stethoscope, label: 'Physician' },
    'health worker': { icon: User, label: 'Health Worker' },
    encoder: { icon: KeyRound, label: 'Encoder' },
  }
  const entry = map[role?.toLowerCase()] || { icon: User, label: role || 'Unknown' }
  const Icon = entry.icon
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
      <Icon className="w-3 h-3" />
      {entry.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const isActive = status === 'active' || !status
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${
        isActive
          ? 'bg-slate-800 text-slate-300 border-slate-700'
          : 'bg-slate-900 text-slate-500 border-slate-800'
      }`}
    >
      {isActive ? (
        <CheckCircle2 className="w-3 h-3 text-slate-400" />
      ) : (
        <XCircle className="w-3 h-3 text-slate-500" />
      )}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const navigate = useNavigate()

  async function fetchUsers() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setUsers(list)
      setFiltered(list)
    } catch (err) {
      console.error('Error fetching users:', err)
      toast.error('Failed to load users. Check Firestore permissions.')
      setUsers([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users)
    } else {
      const q = search.toLowerCase()
      setFiltered(
        users.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q) ||
            u.facility?.toLowerCase().includes(q)
        )
      )
    }
  }, [search, users])

  async function toggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      )
      toast.success(`User status changed to ${newStatus}`)
    } catch {
      toast.error('Failed to update user status')
    }
  }

  async function forcePasswordReset(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), { requiresPasswordChange: true })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, requiresPasswordChange: true } : u))
      )
      toast.success('User will be prompted to reset password on next login')
    } catch {
      toast.error('Failed to set password reset flag')
    }
  }

  async function deleteUser(userId, userName) {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'users', userId))
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success('User record removed from Firestore')
      toast.info('Note: Firebase Auth account must be removed separately via Firebase Console.')
    } catch {
      toast.error('Failed to delete user')
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editingUser) return
    setSavingEdit(true)
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name,
        role: editingUser.role,
        facility: editingUser.facility,
        facilityId: editingUser.facility.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        philhealthAccredId: editingUser.philhealthAccredId || null,
        status: editingUser.status || 'active',
        requiresPasswordChange: Boolean(editingUser.requiresPasswordChange),
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...editingUser } : u))
      )
      toast.success('User profile updated successfully')
      setEditingUser(null)
    } catch (err) {
      console.error('Update error:', err)
      toast.error('Failed to update user profile')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="User Management"
          subtitle="Manage health worker accounts and access"
          icon={Users}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            onClick={() => navigate('/admin/users/new')}
            className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Search + Stats strip */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, role, facility…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {filtered.length} / {users.length} users
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-10 h-10 text-slate-600" />
            <p className="text-sm text-slate-400">
              {search ? 'No users match your search.' : 'No users found in Firestore.'}
            </p>
            {!search && (
              <Button
                onClick={() => navigate('/admin/users/new')}
                className="bg-blue-600 hover:bg-blue-500 text-sm mt-1"
              >
                Add First User
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['NAME / EMAIL', 'ROLE', 'FACILITY', 'PHIL. ACCRED. ID', 'STATUS', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Name / Email */}
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-semibold text-white">{u.name || '—'}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.email || '—'}</div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    {/* Facility */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-xs">{u.facility || '—'}</span>
                      </div>
                    </td>
                    {/* PhilHealth Accred ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-400">
                        {u.philhealthAccredId || '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                      {u.requiresPasswordChange && (
                        <div className="mt-1">
                          <span className="text-[10px] text-amber-400/90 font-mono">Reset Required</span>
                        </div>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/60 focus-visible:ring-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={4}
                          collisionPadding={12}
                          className="w-52 bg-white border-slate-200 text-slate-900 shadow-lg z-50 py-1 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        >
                          <DropdownMenuLabel className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            User Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setEditingUser({ ...u })}
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 focus:bg-slate-50 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
                          >
                            <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span>View / Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => forcePasswordReset(u.id)}
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 focus:bg-slate-50 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
                          >
                            <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span>Force Password Reset</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleStatus(u.id, u.status || 'active')}
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 focus:bg-slate-50 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
                          >
                            {u.status === 'inactive' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span>Activate</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span>Deactivate</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />
                          <DropdownMenuItem
                            onClick={() => deleteUser(u.id, u.name)}
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-rose-700 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-400 dark:focus:bg-slate-800 dark:focus:text-rose-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Record</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Edit User Profile</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              {/* Full Name */}
              <div className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">Full Name</Label>
                <Input
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  required
                />
              </div>

              {/* Email (Read only) */}
              <div className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">Email Address (Auth Identity)</Label>
                <Input
                  value={editingUser.email || ''}
                  disabled
                  className="bg-slate-100 border-slate-200 text-slate-500 font-mono cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">Role</Label>
                <select
                  value={editingUser.role || 'Health Worker'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white text-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Facility */}
              <div className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">Facility</Label>
                <select
                  value={editingUser.facility || FACILITIES[0]}
                  onChange={(e) => setEditingUser({ ...editingUser, facility: e.target.value })}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white text-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {FACILITIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* PhilHealth Accred ID */}
              <div className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">PhilHealth Accreditation ID</Label>
                <Input
                  value={editingUser.philhealthAccredId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, philhealthAccredId: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  placeholder="e.g. PHA-2024-00123"
                />
              </div>

              {/* Status & Password Change Flags */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingUser.status === 'active'}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        status: e.target.checked ? 'active' : 'inactive',
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>Active Account</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(editingUser.requiresPasswordChange)}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        requiresPasswordChange: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>Force Password Change on Next Login</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
