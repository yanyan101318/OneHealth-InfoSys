import { useState, useEffect, useMemo } from 'react'
import {
  Hash,
  Volume2,
  ChevronRight,
  Clock,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { useFacilityFilter } from '../../hooks/useFacilityFilter'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import PageHeader from '../../components/layout/PageHeader'

export default function CounterPage() {
  const { userProfile } = useAuth()
  const facilityName = userProfile?.facility || 'Barangay Health Center - Poblacion'
  const queuesCollection = useMemo(() => collection(db, 'queues'), [])
  const servingCollection = useMemo(
    () => query(
      queuesCollection,
      where('status', '==', 'serving'),
      where('counter', '==', 1)
    ),
    [queuesCollection]
  )
  const waitingCollection = useMemo(
    () => query(queuesCollection, where('status', '==', 'waiting')),
    [queuesCollection]
  )
  const servingQuery = useFacilityFilter(servingCollection, userProfile?.facilityId)
  const waitingQuery = useFacilityFilter(waitingCollection, userProfile?.facilityId)

  const [currentServing, setCurrentServing] = useState({
    ticketNo: '—',
    serviceType: '',
    patientName: '',
    counter: '',
    calledAt: '',
  })

  const [waitingList, setWaitingList] = useState([])

  const [stats, setStats] = useState({
    servedToday: 0,
    waitingCount: 0,
    avgWaitTime: '11 mins',
  })

  const [isCalling, setIsCalling] = useState(false)

  // Real-time Firestore sync on queues collection
  useEffect(() => {
    if (!servingQuery || !waitingQuery) {
      setCurrentServing({ ticketNo: '—', serviceType: '', patientName: '', counter: '', calledAt: '' })
      setWaitingList([])
      setStats((prev) => ({ ...prev, waitingCount: 0 }))
      return undefined
    }

    const unsubscribeServing = onSnapshot(
      servingQuery,
      (snapshot) => {
        const servingItem = snapshot.docs[0]
        if (!servingItem) {
          setCurrentServing({ ticketNo: '—', serviceType: '', patientName: '', counter: '', calledAt: '' })
          return
        }

        const data = servingItem.data()
        setCurrentServing({
          id: servingItem.id,
          ticketNo: data.ticketNo || '—',
          serviceType: data.serviceType || '',
          patientName: data.patientName || '',
          counter: `Counter ${data.counter}`,
          calledAt: data.calledAt || '',
        })
      },
      (err) => {
        console.error('Serving ticket listener failed:', err)
        toast.error(`Unable to load the serving ticket: ${err.message}`)
        setCurrentServing({ ticketNo: '—', serviceType: '', patientName: '', counter: '', calledAt: '' })
      }
    )

    const unsubscribeWaiting = onSnapshot(
      waitingQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => {
            const aTime = typeof a.createdAt?.toMillis === 'function'
              ? a.createdAt.toMillis()
              : new Date(a.createdAt || 0).getTime()
            const bTime = typeof b.createdAt?.toMillis === 'function'
              ? b.createdAt.toMillis()
              : new Date(b.createdAt || 0).getTime()
            return aTime - bTime
          })
        setWaitingList(items)
        setStats((prev) => ({ ...prev, waitingCount: items.length }))
      },
      (err) => {
        console.error('Waiting queue listener failed:', err)
        toast.error(`Unable to load waiting tickets: ${err.message}`)
        setWaitingList([])
        setStats((prev) => ({ ...prev, waitingCount: 0 }))
      }
    )

    return () => {
      unsubscribeServing()
      unsubscribeWaiting()
    }
  }, [servingQuery, waitingQuery])

  const handleCallNext = async () => {
    if (currentServing.ticketNo !== '—') {
      toast.info('Complete or skip the current ticket before calling the next one.')
      return
    }

    setIsCalling(true)
    try {
      if (waitingList.length > 0) {
        const nextTicket = waitingList[0]
        if (!nextTicket.id) {
          throw new Error('The next ticket is missing its Firestore document ID.')
        }
        await updateDoc(doc(db, 'queues', nextTicket.id), {
          status: 'serving',
          counter: 1,
          calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: serverTimestamp(),
        })

        playChime()
        toast.success(`Now serving ticket ${nextTicket.ticketNo} at Counter 1!`)
      } else {
        toast.info('There are no waiting tickets at this facility.')
      }
    } catch (err) {
      toast.error('Failed to call next ticket: ' + err.message)
    } finally {
      setIsCalling(false)
    }
  }

  const handleRecall = () => {
    if (!currentServing.ticketNo || currentServing.ticketNo === '—') {
      toast.info('There is no ticket currently being served.')
      return
    }
    playChime()
    toast.info(`Recalling ticket ${currentServing.ticketNo} to Counter 1...`, {
      icon: <Volume2 className="w-4 h-4 text-amber-400" />,
    })
  }

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.5)
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <PageHeader title="Queue Counter" subtitle="Call and monitor patients at your facility" />
      {/* Header with Facility & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900/70 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Station: Counter 1 (Primary Triage)</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{facilityName}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto font-medium dark:text-slate-400 dark:bg-slate-800/80 dark:border-slate-700/60">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{todayDate}</span>
        </div>
      </div>

      {/* Main Calling Display Card */}
      <Card className="bg-white border border-slate-200 shadow-lg overflow-hidden relative dark:bg-[#1e293b] dark:border-blue-500/30 dark:shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600" />

        <CardHeader className="text-center pb-2 pt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold mx-auto mb-1 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Now Serving
          </div>
          <CardTitle className="text-6xl sm:text-8xl font-black text-slate-900 dark:text-white font-mono tracking-wider py-2">
            {currentServing.ticketNo}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Service: <span className="text-blue-600 dark:text-blue-400 font-medium">{currentServing.serviceType}</span>
            {currentServing.patientName && (
              <span className="text-slate-500 dark:text-slate-400 ml-2">({currentServing.patientName})</span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
            <span>Called at: {currentServing.calledAt}</span>
            <span className="mx-1.5">·</span>
            <Badge variant="outline" className="text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700">
              {currentServing.counter}
            </Badge>
          </div>

          {/* Action Buttons: Call Next & Recall */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-2">
            <Button
              onClick={handleCallNext}
              disabled={isCalling}
              className="w-full sm:flex-1 h-14 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 gap-2"
            >
              <ChevronRight className="w-5 h-5" />
              {isCalling ? 'Calling...' : 'Call Next Ticket'}
            </Button>

            <Button
              variant="outline"
              onClick={handleRecall}
              className="w-full sm:w-auto h-14 px-6 text-base font-semibold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 gap-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Volume2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              Recall
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Metrics & Up Next Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1 dark:bg-[#1e293b] dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">Served Today</span>
          <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{stats.servedToday}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1 dark:bg-[#1e293b] dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">Waiting in Queue</span>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-200 font-mono">{stats.waitingCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1 dark:bg-[#1e293b] dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">Avg. Service Time</span>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-200 font-mono">{stats.avgWaitTime}</p>
        </div>
      </div>
    </div>
  )
}
