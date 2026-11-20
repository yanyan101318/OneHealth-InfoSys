import { useState, useMemo, useEffect } from 'react'
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Volume2,
  XCircle,
  SkipForward,
  RotateCcw,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  collection,
  onSnapshot,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { useFacilityFilter } from '../../hooks/useFacilityFilter'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import PageHeader from '../../components/layout/PageHeader'

export default function QueueManagementPage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [queues, setQueues] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [updatingTicketIds, setUpdatingTicketIds] = useState(() => new Set())
  const queuesCollection = useMemo(() => collection(db, 'queues'), [])
  const queuesQuery = useFacilityFilter(queuesCollection, userProfile?.facilityId)

  // Real-time Firestore listener on queues collection
  useEffect(() => {
    if (!queuesQuery) {
      setQueues([])
      setIsLoading(false)
      return undefined
    }

    const unsubscribe = onSnapshot(
      queuesQuery,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        items.sort((a, b) => {
          const order = { serving: 1, waiting: 2, skipped: 3, done: 4, cancelled: 5 }
          return (order[a.status] || 9) - (order[b.status] || 9)
        })
        setQueues(items)
        setIsLoading(false)
      },
      (error) => {
        console.error('Queues subscription failed:', error)
        toast.error(`Unable to load queue tickets: ${error.message}`)
        setQueues([])
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [queuesQuery])

  // Filter queues
  const filteredQueues = useMemo(() => {
    return queues.filter((item) => {
      const term = searchTerm.toLowerCase().trim()
      const matchSearch =
        !term ||
        (item.ticketNo && item.ticketNo.toLowerCase().includes(term)) ||
        (item.patientName && item.patientName.toLowerCase().includes(term))

      const matchStatus =
        statusFilter === 'All' || item.status?.toLowerCase() === statusFilter.toLowerCase()

      const matchService =
        serviceFilter === 'All' || item.serviceType === serviceFilter

      return matchSearch && matchStatus && matchService
    })
  }, [queues, searchTerm, statusFilter, serviceFilter])
  const isCounterBusy = queues.some(
    (item) => item.status === 'serving' && item.counter === 1
  )

  const updateTicket = async (item, updates, successMessage, errorMessage) => {
    if (!item.id) {
      toast.error('This ticket is missing its Firestore document ID.')
      return
    }

    setUpdatingTicketIds((current) => new Set(current).add(item.id))
    try {
      await updateDoc(doc(db, 'queues', item.id), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      if (successMessage) successMessage()
    } catch (err) {
      console.error(`Queue update failed for ${item.id}:`, err)
      toast.error(`${errorMessage}: ${err.message}`)
    } finally {
      setUpdatingTicketIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
    }
  }

  // Row Action Handlers
  const handleCall = (item) => updateTicket(
    item,
    {
      status: 'serving',
      counter: 1,
      calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    () => toast.success(`Calling ticket ${item.ticketNo} to Counter 1!`),
    'Failed to call ticket'
  )

  const handleDone = (item) => updateTicket(
    item,
    { status: 'done' },
    () => toast.success(`Marked ticket ${item.ticketNo} as Completed.`),
    'Failed to update status'
  )

  const handleSkip = (item) => updateTicket(
    item,
    { status: 'skipped', counter: null },
    () => toast.info(`Skipped ticket ${item.ticketNo}. Beneficiary may be recalled later.`),
    'Failed to skip ticket'
  )

  const handleCancel = (item) => updateTicket(
    item,
    { status: 'cancelled', counter: null },
    () => toast.warning(`Cancelled ticket ${item.ticketNo}.`),
    'Failed to cancel ticket'
  )

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'serving':
        return (
          <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border border-blue-200 font-medium bg-blue-100 text-blue-800 dark:border-blue-500 dark:bg-blue-600 dark:text-white">
            Serving
          </span>
        )
      case 'waiting':
        return (
          <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800">
            Waiting
          </span>
        )
      case 'done':
        return (
          <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800">
            Done
          </span>
        )
      case 'skipped':
        return (
          <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Skipped
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <PageHeader
        title="Queue Management"
        subtitle={`Monitor queue status and manage patient flow${userProfile?.facility ? ` · ${userProfile.facility}` : ''}`}
        icon={Layers}
        actions={(
          <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/account/queue-generate')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Generate Ticket
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/account/counter')}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            Counter View
          </Button>
          </div>
        )}
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by Ticket No. or Patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="md:col-span-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="Serving">Serving</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Service Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                <SelectItem value="All">All Services</SelectItem>
                <SelectItem value="General Consultation">General Consultation</SelectItem>
                <SelectItem value="Health Screening">Health Screening</SelectItem>
                <SelectItem value="PhilHealth Encoding">PhilHealth Encoding</SelectItem>
                <SelectItem value="Laboratory & Diagnostics">Laboratory & Diagnostics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('All')
                setServiceFilter('All')
              }}
              className="h-9 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="bg-white border border-slate-200 shadow-sm dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs text-slate-900 dark:text-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3.5">Ticket No.</th>
                    <th className="px-6 py-3.5">Patient / Beneficiary</th>
                    <th className="px-6 py-3.5">Service Type</th>
                    <th className="px-6 py-3.5">Time Issued</th>
                    <th className="px-6 py-3.5">Station</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-[#1e293b] dark:divide-slate-800">
                  {filteredQueues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No active queue tickets match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQueues.map((item) => (
                      <tr key={item.id} className="bg-white hover:bg-slate-50 border-b border-slate-100 transition-colors dark:bg-[#1e293b] dark:hover:bg-slate-800/40 dark:border-slate-800">
                        <td className="px-6 py-3.5 font-mono text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.ticketNo}</span>
                          {item.priority && (
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded font-sans dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              Priority
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-200">
                          {item.patientName || 'Walk-in'}
                        </td>
                        <td className="px-6 py-3.5 text-blue-600 dark:text-blue-400">{item.serviceType}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-400">{item.issuedAt || 'Just now'}</td>
                        <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{item.counter || '-'}</td>
                        <td className="px-6 py-3.5">{getStatusBadge(item.status)}</td>
                        <td className="px-6 py-3.5 text-right space-x-1">
                          {item.status !== 'serving' && item.status !== 'done' && (
                            <Button
                              size="sm"
                              disabled={updatingTicketIds.has(item.id) || isCounterBusy}
                              onClick={() => handleCall(item)}
                              className="h-7 px-2.5 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-medium"
                            >
                              Call
                            </Button>
                          )}
                          {item.status === 'serving' && (
                            <Button
                              size="sm"
                              disabled={updatingTicketIds.has(item.id)}
                              onClick={() => handleDone(item)}
                              className="h-7 px-2.5 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-medium"
                            >
                              Done
                            </Button>
                          )}
                          {item.status !== 'done' && item.status !== 'skipped' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingTicketIds.has(item.id)}
                              onClick={() => handleSkip(item)}
                              className="h-7 px-2 text-[11px] border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Skip
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updatingTicketIds.has(item.id)}
                            onClick={() => handleCancel(item)}
                            className="h-7 px-2 text-[11px] border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700"
                          >
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
