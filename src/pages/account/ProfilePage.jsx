import { useState, useEffect } from 'react'
import { User, Mail, Phone, Building2, Shield, Save, CheckCircle2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import PageHeader from '../../components/layout/PageHeader'

export default function ProfilePage() {
  const { currentUser, userProfile } = useAuth()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: userProfile?.name || currentUser?.displayName || 'Maria Santos',
    email: currentUser?.email || userProfile?.email || 'msantos@onehealth.gov.ph',
    phone: userProfile?.phone || '+63 917 123 4567',
    role: userProfile?.role || 'Health Worker',
    facility: userProfile?.facility || 'Barangay Health Center - Poblacion',
    licenseNumber: userProfile?.licenseNumber || 'PRC-0941283',
  })

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        name: userProfile.name || prev.name,
        email: userProfile.email || currentUser?.email || prev.email,
        phone: userProfile.phone || prev.phone,
        role: userProfile.role || prev.role,
        facility: userProfile.facility || prev.facility,
      }))
    }
  }, [userProfile, currentUser])

  const initials = formData.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid)
        await setDoc(
          userRef,
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }
      toast.success('Profile changes saved successfully!')
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="User Profile"
        subtitle="Manage your personal credentials, facility assignment, and contact details"
        icon={User}
      />

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Avatar Card */}
          <Card className="bg-white border-slate-200 shadow-sm md:col-span-1 dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-none">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Picture</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Official PhilHealth Yakap ID Avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative">
                <Avatar className="w-28 h-28 border-2 border-blue-500/40 shadow-xl">
                  <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => toast.info('Avatar photo upload available soon')}
                  className="absolute bottom-0 right-0 p-2 bg-slate-900 rounded-full border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-md dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700"
                  aria-label="Upload photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{formData.name}</p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {formData.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-1">
                  {formData.facility}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right: Form Information */}
          <Card className="bg-white border-slate-200 shadow-sm md:col-span-2 dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-none">
            <CardHeader className="border-b border-slate-200 pb-4 dark:border-slate-800">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Personnel Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Data recorded under DOH / PhilHealth Administrative Registry
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900 text-xs h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Work Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900 text-xs h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Contact Mobile Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900 text-xs h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="license" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    PRC License / Accreditation ID
                  </Label>
                  <Input
                    id="license"
                    disabled
                    value={formData.licenseNumber}
                    className="bg-slate-100 border-slate-300 text-slate-500 text-xs h-9 font-mono cursor-not-allowed dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="facility" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Assigned Healthcare Facility
                </Label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-slate-200">{formData.facility}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50">
                    Verified Station
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-slate-200 pt-4 flex justify-end dark:border-slate-800">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
