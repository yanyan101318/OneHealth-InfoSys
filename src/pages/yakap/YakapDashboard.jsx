import { useEffect, useMemo, useState } from 'react'
import { Building2, CheckCircle2, Clock3, FileText, House, Stethoscope, UserRound } from 'lucide-react'
import { CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../../lib/firebase'
import { isAdminUser } from '../../lib/facilityAccess'
import { useFacilityFilter } from '../../hooks/useFacilityFilter'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { StatCard, ChartContainer } from '../../components/dashboard/DashboardWidgets'
import PageHeader from '../../components/layout/PageHeader'
import useAppStore from '../../store/useAppStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEARS = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index))

function asDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function YakapDashboard() {
  const { userProfile } = useAuth()
  const { selectedYear, setSelectedYear } = useAppStore()
  const isAdmin = isAdminUser(userProfile)
  const [facilities, setFacilities] = useState([])
  const [selectedFacility, setSelectedFacility] = useState(isAdmin ? 'all' : userProfile?.facilityId || '')
  const [year, setYear] = useState(selectedYear || String(new Date().getFullYear()))
  const [patients, setPatients] = useState([])
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const patientsCollection = useMemo(() => collection(db, 'patients'), [])
  const patientQuery = useFacilityFilter(patientsCollection, selectedFacility)

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadFacilities() {
      if (!isAdmin) {
        const assignedFacility = userProfile?.facilityId
          ? [{ id: userProfile.facilityId, name: userProfile.facility || userProfile.facilityId }]
          : []
        setFacilities(assignedFacility)
        setSelectedFacility(userProfile?.facilityId || '')
        setLoadingFacilities(false)
        return
      }

      try {
        const snapshot = await getDocs(collection(db, 'facilities'))
        const available = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        if (!active) return
        setFacilities(available)
        setSelectedFacility((current) => {
          if (current === 'all' || available.some((facility) => facility.id === current)) return current
          return 'all'
        })
      } catch (error) {
        if (!active) return
        console.error('Failed to load Yakap dashboard facilities:', error)
        toast.error(`Unable to load facilities: ${error.message}`)
        setFacilities([])
      } finally {
        if (active) setLoadingFacilities(false)
      }
    }
    loadFacilities()
    return () => { active = false }
  }, [isAdmin, userProfile?.facilityId, userProfile?.facility])

  useEffect(() => {
    if (!patientQuery || !selectedFacility || (!isAdmin && !userProfile?.facilityId)) {
      setPatients([])
      setLoadingPatients(false)
      return undefined
    }
    setLoadingPatients(true)
    const unsubscribe = onSnapshot(
      patientQuery,
      (snapshot) => {
        setPatients(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
        setLoadingPatients(false)
      },
      (error) => {
        console.error('Yakap dashboard patient listener failed:', error)
        toast.error(`Unable to load facility records: ${error.message}`)
        setPatients([])
        setLoadingPatients(false)
      }
    )
    return () => unsubscribe()
  }, [isAdmin, patientQuery, selectedFacility, userProfile?.facilityId])

  const facilityName = selectedFacility === 'all'
    ? 'All Facilities'
    : facilities.find((facility) => facility.id === selectedFacility)?.name
      || userProfile?.facility
      || 'Selected facility'
  const yearlyPatients = useMemo(() => patients.filter((patient) => {
    const date = asDate(patient.enlistmentDate || patient.createdAt)
    return date && String(date.getFullYear()) === year
  }), [patients, year])
  const screenings = yearlyPatients.filter((patient) =>
    patient.screened === true ||
    String(asDate(patient.screeningDate || patient.lastScreeningDate)?.getFullYear() || '') === year ||
    patient.screeningStatus === 'Completed'
  )
  const consultations = yearlyPatients.filter((patient) =>
    patient.consulted === true ||
    String(asDate(patient.consultationDate)?.getFullYear() || '') === year ||
    (Array.isArray(patient.consultations) && patient.consultations.length > 0) ||
    Number(patient.consultationCount) > 0
  )
  const drafts = yearlyPatients.filter((patient) => patient.status?.toLowerCase() === 'draft')
  const synced = yearlyPatients.filter((patient) => patient.synced === true)
  const unsynced = yearlyPatients.filter((patient) => patient.synced === false)

  const chartData = useMemo(() => MONTHS.map((month, index) => {
    const monthPrefix = `${year}-${String(index + 1).padStart(2, '0')}`
    const inMonth = (value) => {
      if (typeof value === 'string' && value.startsWith(monthPrefix)) return true
      const date = asDate(value)
      return date && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === monthPrefix
    }
    return {
      month,
      registrations: yearlyPatients.filter((patient) => inMonth(patient.enlistmentDate) || inMonth(patient.createdAt)).length,
      screenings: yearlyPatients.filter((patient) =>
        inMonth(patient.screeningDate || patient.lastScreeningDate) ||
        (inMonth(patient.enlistmentDate) && (patient.screened === true || patient.screeningStatus === 'Completed'))
      ).length,
      consultations: yearlyPatients.filter((patient) =>
        inMonth(patient.consultationDate) ||
        (inMonth(patient.enlistmentDate) && (patient.consulted === true || Number(patient.consultationCount) > 0))
      ).length,
    }
  }), [yearlyPatients, year])

  const metrics = [
    { title: 'Total Registration', value: yearlyPatients.length, icon: UserRound, color: 'blue' },
    { title: 'Total Drafts', value: drafts.length, icon: FileText, color: 'violet' },
    { title: 'Health Screenings', value: screenings.length, icon: Stethoscope, color: 'amber' },
    { title: 'Consultations', value: consultations.length, icon: House, color: 'blue' },
    { title: 'Synced Patients', value: synced.length, icon: CheckCircle2, color: 'emerald', valueColor: 'text-emerald-600 dark:text-emerald-400', detail: 'Up to date' },
    { title: 'Unsynced Patients', value: unsynced.length, icon: Clock3, color: 'amber', valueColor: 'text-amber-600 dark:text-amber-400', detail: 'Awaiting synchronization' },
  ]
  const hasData = chartData.some((item) => item.registrations + item.screenings + item.consultations > 0)
  const loading = loadingFacilities || loadingPatients

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <PageHeader title="Yakap Dashboard" subtitle="Facility-level registration and service monitoring" />
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Building2 className="h-5 w-5" /></div>
          <div className="w-full min-w-0 sm:w-80">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Facility</p>
            {isAdmin ? (
              <Select value={selectedFacility} onValueChange={setSelectedFacility} disabled={!facilities.length}>
                <SelectTrigger className="font-semibold"><SelectValue placeholder="Select a facility" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities.map((facility) => <SelectItem key={facility.id} value={facility.id}>{facility.name || facility.id}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground">
                {userProfile?.facility || 'No assigned facility'}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-28">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Year</p>
            <Select value={year} onValueChange={(value) => {
              setYear(value)
              setSelectedYear(value)
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${
            isOnline
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => <Card key={metric.title} className="p-5"><Skeleton className="h-20 w-full" /></Card>)}
        </div>
      ) : patients.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-foreground">No records found for {facilityName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Records added to this facility will appear here in real time.</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric) => <StatCard key={metric.title} {...metric} />)}
          </div>
          <ChartContainer
            title={`Monthly Services Analytics (${year})`}
            description={`${facilityName} · registrations, health screenings, and consultations`}
            empty={!hasData}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--card-foreground))' }} labelStyle={{ color: 'hsl(var(--card-foreground))' }} />
                <Legend verticalAlign="top" height={32} />
                <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="screenings" name="Health Screenings" stroke="#14b8a6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="consultations" name="Consultations" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </>
      )}
    </div>
  )
}
