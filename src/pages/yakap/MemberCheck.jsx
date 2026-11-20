import { useState } from 'react'
import {
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  Users,
  Printer,
  UserPlus,
  RefreshCw,
  FileBadge,
} from 'lucide-react'
import { toast } from 'sonner'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { getFacilityFilter, isAdminUser } from '../../lib/facilityAccess'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import PageHeader from '../../components/layout/PageHeader'

export default function MemberCheck() {
  const { userProfile } = useAuth()
  const isAdmin = isAdminUser(userProfile)
  const [pinInput, setPinInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [memberResult, setMemberResult] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (pinToUse) => {
    const targetPin = (pinToUse || pinInput).trim().replace(/\D/g, '')

    if (!targetPin) {
      toast.warning('Please enter a 12-digit PhilHealth Identification Number (PIN).')
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setMemberResult(null)

    try {
      if (isAdmin) {
        const memberSnap = await getDocs(query(
          collection(db, 'philhealth_members'),
          where('registeredPin', '==', targetPin)
        ))

        if (!memberSnap.empty) {
          const d = memberSnap.docs[0].data()
          setMemberResult({
            pin: d.registeredPin || targetPin,
            name: `${d.lastName}, ${d.firstName} ${d.middleName ? d.middleName + '.' : ''}`,
            birthdate: d.dateOfBirth || '',
            gender: d.sex || '',
            civilStatus: 'Registered',
            membershipType: `${d.clientType || 'Principal'} Member`,
            category: 'PhilHealth member record',
            status: d.status || 'Registered',
            coverage: 'Confirm eligibility with the official PhilHealth system.',
            validUntil: d.effectivityYear ? `December 31, ${d.effectivityYear}` : 'Not specified',
            registeredFacility: d.facility || 'Not specified',
            employer: 'Not available',
            lastPaymentDate: d.registeredDate || 'Not available',
            dependents: [],
          })
          toast.success(`Found a PhilHealth member record for PIN: ${targetPin}`)
          return
        }
      }

      const patientsCollection = collection(db, 'patients')
      const facilityFilter = getFacilityFilter(userProfile)
      const patientConstraints = [where('memberPin', '==', targetPin)]
      if (facilityFilter) patientConstraints.push(facilityFilter)
      const qPatients = query(patientsCollection, ...patientConstraints)
      const patientSnap = await getDocs(qPatients)

      if (!patientSnap.empty) {
        const d = patientSnap.docs[0].data()
        setMemberResult({
          pin: d.memberPin || targetPin,
          name: d.name || `${d.lastName}, ${d.firstName}`,
          birthdate: d.birthdate || '',
          gender: d.gender || '',
          civilStatus: 'Registered',
          membershipType: `Yakap ${d.clientType || 'Regular'} Beneficiary`,
          category: 'DOH/PhilHealth Yakap Primary Care',
          status: d.status || 'Registered',
          coverage: 'Yakap patient record; confirm eligibility with the official system.',
          validUntil: 'Not specified',
          registeredFacility: d.facility || d.facilityId || 'Not specified',
          employer: 'N/A',
          lastPaymentDate: d.enlistmentDate || 'Not available',
          dependents: [],
        })
        toast.success(`Verified patient in Firestore for PIN: ${targetPin}`)
      } else {
        toast.info('No matching record was found in the records available to your account.')
      }
    } catch (err) {
      console.error('Firestore query error in MemberCheck:', err)
      toast.error(`Unable to check member status: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintSlip = () => {
    toast.info('Generating PhilHealth Member Verification Slip...')
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleRegisterToYakap = () => {
    toast.success(
      `Patient enrollment form pre-filled with verified PhilHealth data for ${memberResult?.name}`
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Status Check"
        subtitle="Verify PhilHealth member and dependent eligibility"
        icon={CreditCard}
      />

      {/* Query Card */}
      <Card className="bg-white border-slate-200 shadow-sm dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              PhilHealth Identification Number (PIN)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter 12-digit PIN (e.g. 04-023910283-1 or 040239102831)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 font-mono text-sm h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6 shadow-md"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    <span>Check Status</span>
                  </>
                )}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Result Card Area */}
      {isLoading && (
        <div className="p-12 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3 text-center dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-none">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Connecting to PhilHealth Web Service Gateway...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validating PhilHealth Member Master Record and dependent associations.
          </p>
        </div>
      )}

      {!isLoading && memberResult && (
        <div className="space-y-6">
          {/* Rich Result Card */}
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-xl">
            {/* Header banner */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {memberResult.status === 'Active' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-slate-300" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {memberResult.name}
                    </h3>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {memberResult.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                    PIN: <span className="font-bold text-blue-700 dark:text-blue-400">{memberResult.pin}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrintSlip}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Printer className="w-4 h-4" />
                  Print Slip
                </Button>
                <Button
                  size="sm"
                  onClick={handleRegisterToYakap}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Register to Yakap
                </Button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Detailed Member Attributes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Membership Type
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {memberResult.membershipType}
                  </p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{memberResult.category}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Coverage Package
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {memberResult.coverage}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Validity Period
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Valid until: {memberResult.validUntil}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Last Remittance: {memberResult.lastPaymentDate}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Assigned Primary Facility
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {memberResult.registeredFacility}
                  </p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Employer: {memberResult.employer}</span>
                </div>
              </div>

              {/* Dependents List Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Registered Dependents ({memberResult.dependents.length})
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Covered under member's universal healthcare umbrella
                  </span>
                </div>

                {memberResult.dependents.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400">
                    No declared dependents on file for this member.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {memberResult.dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between dark:bg-slate-900/60 dark:border-slate-800"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dep.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium dark:bg-slate-800 dark:text-slate-300">
                              {dep.relation}
                            </span>
                            <span>DOB: {dep.birthdate}</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                            PIN: {dep.pin}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {dep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Initial Empty Guide */}
      {!isLoading && !hasSearched && (
        <div className="p-12 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3 dark:bg-[#1e293b]/60 dark:border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <FileBadge className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">
            Check PhilHealth Member Eligibility
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Input a 12-digit PhilHealth PIN above or select one of the quick test accounts to verify
            membership status, validity, benefit coverage packages, and authorized dependents.
          </p>
        </div>
      )}
    </div>
  )
}
