import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  Home,
  Users,
  UserRound,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { collection, getDocs } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../lib/firebase'
import { isAdminUser } from '../lib/facilityAccess'
import { useFacilityFilter } from '../hooks/useFacilityFilter'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { StatCard, ChartContainer, ActivityFeed } from '../components/dashboard/DashboardWidgets'
import PageHeader from '../components/layout/PageHeader'
import useAppStore from '../store/useAppStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEARS = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index))
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#94a3b8']

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U'
}

function dateFor(patient) {
  const dates = [patient.updatedAt, patient.createdAt, patient.enlistmentDate]
    .map(parseDate)
    .filter((date) => date && !Number.isNaN(date.getTime()))
  return dates.sort((left, right) => right.getTime() - left.getTime())[0] || null
}

function parseDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getWeeksInMonth(year, month) {
  const firstDayOffset = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil((firstDayOffset + daysInMonth) / 7)

  return Array.from({ length: weekCount }, (_, index) => {
    const startDay = index === 0 ? 1 : 8 - firstDayOffset + (index - 1) * 7
    const endDay = Math.min(daysInMonth, startDay + (index === 0 ? 6 - firstDayOffset : 6))
    return {
      value: String(index + 1),
      label: `Week ${index + 1}`,
      start: new Date(year, month, startDay),
      end: new Date(year, month, endDay + 1),
    }
  })
}

function uniqueCount(items, keys) {
  const values = items.map((item) => keys.map((key) => item[key]).find(Boolean)).filter(Boolean)
  return new Set(values.map(String)).size
}

function registrationDate(patient) {
  const raw = patient.enlistmentDate || patient.createdAt
  return parseDate(raw)
}

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth()
  const { selectedYear, setSelectedYear } = useAppStore()
  const thisYear = String(new Date().getFullYear())
  const [year, setYear] = useState(selectedYear || thisYear)
  const [month, setMonth] = useState(String(new Date().getMonth()))
  const [week, setWeek] = useState('1')
  const [patients, setPatients] = useState([])
  const [facilities, setFacilities] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const patientsCollection = useMemo(() => collection(db, 'patients'), [])
  const syncLogsCollection = useMemo(() => collection(db, 'sync_logs'), [])
  const patientsQuery = useFacilityFilter(patientsCollection)
  const syncLogsQuery = useFacilityFilter(syncLogsCollection)
  const weekOptions = useMemo(() => getWeeksInMonth(Number(year), Number(month)), [year, month])
  const selectedWeek = weekOptions.find((item) => item.value === week) || weekOptions[0]

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      if (!currentUser?.uid || !patientsQuery || !syncLogsQuery) {
        setPatients([])
        setFacilities([])
        setActivity([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const isAdmin = isAdminUser(userProfile)
        const facilitiesPromise = isAdmin
          ? getDocs(collection(db, 'facilities'))
          : Promise.resolve(null)
        const [facilitySnapshot, patientSnapshot, syncSnapshot] = await Promise.all([
          facilitiesPromise,
          getDocs(patientsQuery),
          getDocs(syncLogsQuery),
        ])
        if (!active) return
        const loadedFacilities = isAdmin
          ? facilitySnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
          : userProfile?.facilityId
            ? [{ id: userProfile.facilityId, name: userProfile.facility || userProfile.facilityId }]
            : []
        const loadedPatients = patientSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        const patientActivity = loadedPatients.map((patient) => {
          const date = dateFor(patient)
          return date
            ? {
                id: patient.id,
                action: patient.status?.toLowerCase() === 'draft'
                  ? 'Enlistment draft created'
                  : 'Enlistment successfully updated',
                user: patient.facility || 'System',
                timestamp: date,
              }
            : null
        }).filter(Boolean)
        const syncActivity = syncSnapshot.docs.map((item) => {
          const data = item.data()
          const raw = data.timestamp || data.createdAt
          const timestamp = parseDate(raw)
          return timestamp && !Number.isNaN(timestamp.getTime())
            ? {
                id: `sync-${item.id}`,
                action: data.status === 'success' ? `Patient sync completed (${data.recordsSynced || 0} records)` : 'Patient sync updated',
                user: data.userName || 'System',
                timestamp,
              }
            : null
        }).filter(Boolean)
        if (!active) return
        setFacilities(loadedFacilities)
        setPatients(loadedPatients)
        setActivity([...patientActivity, ...syncActivity]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10))
      } catch (error) {
        if (!active) return
        console.error('Failed to load global dashboard data:', error)
        toast.error(`Unable to load dashboard data: ${error.message}`)
        setPatients([])
        setFacilities([])
        setActivity([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [currentUser?.uid, patientsQuery, syncLogsQuery, userProfile])

  const scopedPatients = useMemo(
    () => patients.filter((patient) => {
      const date = registrationDate(patient)
      return date && String(date.getFullYear()) === year
    }),
    [patients, year]
  )

  const registeredPatients = scopedPatients.filter((patient) => patient.status?.toLowerCase() !== 'draft')
  const summary = [
    { title: 'Overall Individuals', value: scopedPatients.length, icon: BarChart3, color: 'blue' },
    { title: 'Registered Individuals', value: registeredPatients.length, icon: UserRound, color: 'violet' },
    { title: 'Registered Households', value: uniqueCount(registeredPatients, ['householdId', 'householdNo', 'householdNumber']), icon: Home, color: 'emerald' },
    { title: 'Registered Families', value: uniqueCount(registeredPatients, ['familyId', 'familyNo', 'familyNumber']), icon: Users, color: 'amber' },
  ]

  const weekData = useMemo(() => {
    if (!selectedWeek) return []
    const dayCount = Math.round((selectedWeek.end - selectedWeek.start) / 86400000)
    const days = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(selectedWeek.start)
      date.setDate(date.getDate() + index)
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        registrations: 0,
      }
    })
    scopedPatients.forEach((patient) => {
      const date = registrationDate(patient)
      if (date && date >= selectedWeek.start && date < selectedWeek.end) {
        const dayIndex = Math.floor((date - selectedWeek.start) / 86400000)
        days[dayIndex].registrations += 1
      }
    })
    return days
  }, [scopedPatients, selectedWeek])

  const monthlyData = useMemo(() => MONTHS.map((label, index) => ({
    month: label,
    registrations: scopedPatients.filter((patient) => registrationDate(patient)?.getMonth() === index).length,
  })), [scopedPatients])

  const genderData = useMemo(() => {
    const totals = { Male: 0, Female: 0, 'Not Set': 0 }
    registeredPatients.forEach((patient) => {
      const gender = patient.gender?.toLowerCase()
      if (gender === 'male') totals.Male += 1
      else if (gender === 'female') totals.Female += 1
      else totals['Not Set'] += 1
    })
    return Object.entries(totals).map(([name, value], index) => ({
      name,
      value,
      color: GENDER_COLORS[index],
    }))
  }, [registeredPatients])

  const activeFacility = useMemo(() => {
    const counts = new Map()
    registeredPatients.forEach((patient) => {
      const id = patient.facilityId || 'unknown'
      counts.set(id, (counts.get(id) || 0) + 1)
    })
    return [...counts.entries()]
      .map(([id, count]) => ({
        id,
        name: facilities.find((facility) => facility.id === id)?.name || id,
        count,
      }))
      .sort((a, b) => b.count - a.count)[0]
  }, [registeredPatients, facilities])

  const selectedActivity = useMemo(() => activity.filter((item) => {
    return selectedWeek && item.timestamp >= selectedWeek.start && item.timestamp < selectedWeek.end
  }), [activity, selectedWeek])

  const facilityName = userProfile?.facility || 'Assigned facilities'
  const userName = userProfile?.name || currentUser?.displayName || currentUser?.email || 'User'

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <PageHeader title="System Dashboard" subtitle="Regional overview and analytics" />
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <CardContent className="flex min-w-0 items-center gap-3 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              {initials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">Welcome back</p>
              <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">{userName}</h3>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {userProfile?.role || 'User'} · {userProfile?.facility || userProfile?.facilityId || 'Assigned facility'}
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Regional system overview
              </span>
            </div>
          </CardContent>
        </Card>

        {summary.map((item) => (
          <div key={item.title} className="col-span-12 lg:col-span-2">
            {loading
              ? <Card className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><Skeleton className="h-24 w-full" /></Card>
              : <StatCard {...item} />}
          </div>
        ))}

        <ActivityFeed
          activities={selectedActivity}
          loading={loading}
          className="col-span-12 lg:col-span-4"
        />
        <ChartContainer
          className="col-span-12 lg:col-span-8"
          title="Weekly Registration"
          description="Daily registrations for the selected week"
          actions={(
            <div className="flex flex-wrap gap-2">
              <Select value={year} onValueChange={(value) => {
                setYear(value)
                setWeek('1')
                setSelectedYear(value)
              }}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={month} onValueChange={(value) => {
                setMonth(value)
                setWeek('1')
              }}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((value, index) => <SelectItem key={value} value={String(index)}>{value}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={selectedWeek?.value || '1'} onValueChange={setWeek}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{weekOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          empty={!loading && weekData.every((item) => item.registrations === 0)}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--card-foreground))' }} labelStyle={{ color: 'hsl(var(--card-foreground))' }} />
              <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <Card className="col-span-12 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <CardHeader><CardTitle className="text-base">Most Active Facility</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-20 w-full" /> : activeFacility ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-4">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Building2 className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{activeFacility.name}</p>
                  <p className="text-sm text-muted-foreground">Top facility in {year}</p>
                </div>
                <span className="text-xl font-bold text-foreground">{activeFacility.count}</span>
              </div>
            ) : <p className="py-8 text-center text-sm text-muted-foreground">No facility registrations found for {year}.</p>}
          </CardContent>
        </Card>

        <ChartContainer className="col-span-12 lg:col-span-5" title={`Monthly Registration (${year})`} description="Registered individuals by month" loading={loading} empty={!loading && monthlyData.every((item) => item.registrations === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--card-foreground))' }} labelStyle={{ color: 'hsl(var(--card-foreground))' }} />
              <Bar dataKey="registrations" name="Registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer className="col-span-12 lg:col-span-3" title="Gender Distribution" description="Registered individuals" loading={loading} empty={!loading && genderData.every((item) => item.value === 0)}>
          <div className="flex h-full items-center">
            <div className="h-full min-h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={3}>
                    {genderData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--card-foreground))' }} labelStyle={{ color: 'hsl(var(--card-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 pr-2">
              {genderData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>
        <p className="col-span-12 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Aggregated registration data for {year}
        </p>
      </div>
    </div>
  )
}
