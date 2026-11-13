import { useState } from 'react'
import {
  FilePlus,
  Printer,
  Sparkles,
  Ticket,
  Clock,
  Building2,
  CheckCircle2,
  User,
  Heart,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import PageHeader from '../../components/layout/PageHeader'

const serviceTypes = [
  { id: 'General Consultation', prefix: 'A', desc: 'Primary care physician check-up & diagnosis' },
  { id: 'Health Screening', prefix: 'B', desc: 'Blood pressure, glucose, BMI risk evaluation' },
  { id: 'PhilHealth Encoding', prefix: 'C', desc: 'Yakap enrollment & e-claims document processing' },
  { id: 'Laboratory & Diagnostics', prefix: 'D', desc: 'CBC, urinalysis, sputum & diagnostic orders' },
  { id: 'Pharmacy & Dispensing', prefix: 'P', desc: 'Primary essential medicine disbursement' },
]

export default function QueueGeneratePage() {
  const { userProfile } = useAuth()
  const facilityName = userProfile?.facility || 'Barangay Health Center - Poblacion'

  const [serviceType, setServiceType] = useState('General Consultation')
  const [patientName, setPatientName] = useState('')
  const [memberPin, setMemberPin] = useState('')
  const [isPriority, setIsPriority] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Last generated ticket
  const [generatedTicket, setGeneratedTicket] = useState({
    ticketNo: 'A-015',
    serviceType: 'General Consultation',
    patientName: 'Santos, Maria',
    priority: false,
    issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString(),
    estimatedWait: '10 - 15 mins',
  })

  const handleGenerate = async (e) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const selected = serviceTypes.find((s) => s.id === serviceType)
      const prefix = selected ? selected.prefix : 'A'
      const randomNum = Math.floor(10 + Math.random() * 89)
      const ticketNo = `${prefix}-${isPriority ? 'P' : ''}${randomNum}`
      const now = new Date()

      const ticketData = {
        ticketNo,
        serviceType,
        patientName: patientName.trim() || 'Walk-in Beneficiary',
        memberPin: memberPin.trim() || 'N/A',
        priority: isPriority,
        status: 'waiting',
        issuedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString(),
        facilityName,
        createdAt: now.toISOString(),
      }

      // Add to Firestore queues collection
      try {
        await addDoc(collection(db, 'queues'), ticketData)
      } catch (fsErr) {
        console.warn('Firestore queue sync note:', fsErr)
      }

      setGeneratedTicket({
        ...ticketData,
        estimatedWait: '8 - 12 mins',
      })

      toast.success(`Generated ticket ${ticketNo} successfully!`)
      // Clear inputs
      setPatientName('')
      setMemberPin('')
      setIsPriority(false)
    } catch (err) {
      toast.error('Failed to generate ticket: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    toast.success(`Printing ticket ${generatedTicket.ticketNo}... (Mock Printer Dispatch)`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Queue Ticket Generator"
        subtitle="Issue queue numbers for patient triage and health services"
        icon={FilePlus}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <Card className="bg-white border border-slate-200 shadow-sm md:col-span-7 dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-none">
          <CardHeader className="border-b border-slate-200 pb-4 dark:border-slate-800">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-400" />
              Ticket Generation Form
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Select primary care service category and beneficiary information
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleGenerate}>
            <CardContent className="p-6 space-y-4 text-xs">
              {/* Service Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Service Category *</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-10 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                    {serviceTypes.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="text-xs">
                        <span className="font-semibold">{service.id}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">({service.desc})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patient Name (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="patientName" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Patient Name (Optional)
                </Label>
                <Input
                  id="patientName"
                  placeholder="e.g. Maria Santos (or leave blank for walk-in)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Member PIN (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="memberPin" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  PhilHealth Member PIN (Optional)
                </Label>
                <Input
                  id="memberPin"
                  placeholder="12-digit PhilHealth PIN"
                  value={memberPin}
                  onChange={(e) => setMemberPin(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs h-9 font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Priority Lane Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-xs dark:bg-slate-800/80 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={isPriority}
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                      Priority Lane (Senior Citizen / PWD / Pregnant)
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Flags ticket for expedited triage counter placement.
                    </span>
                  </div>
                </label>
              </div>
            </CardContent>

            <CardFooter className="border-t border-slate-200 pt-4 flex justify-end dark:border-slate-800">
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2"
              >
                <FilePlus className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Generate Ticket'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Right: Ticket Preview & Print Section */}
        <Card className="bg-white border border-slate-200 shadow-sm md:col-span-5 flex flex-col justify-between dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-none">
          <CardHeader className="border-b border-slate-200 pb-3 dark:border-slate-800">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Ticket Preview</span>
              <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-700">
                Live Receipt
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 flex flex-col items-center">
            {/* Thermal Print Slip Mockup */}
            <div className="w-full max-w-[280px] bg-slate-50 border-2 border-dashed border-slate-300 p-5 rounded-xl shadow-inner text-center space-y-3 font-sans dark:bg-slate-900 dark:border-slate-700">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  OneHealth InfoSys
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">{facilityName}</div>
                <div className="text-[10px] text-slate-500">Universal Health Care Yakap Station</div>
              </div>

                <div className="py-2 border-y border-dashed border-slate-300 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  Your Queue Number
                </span>
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-wider py-1">
                  {generatedTicket.ticketNo}
                </div>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                  {generatedTicket.serviceType}
                </span>
                {generatedTicket.priority && (
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 mt-1 block w-fit mx-auto rounded-full font-medium dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    Priority Lane
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 text-left px-1">
                <div className="flex justify-between">
                  <span>Patient:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[140px]">
                    {generatedTicket.patientName || 'Walk-in'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">
                    {generatedTicket.date} {generatedTicket.issuedAt}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Waiting:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{generatedTicket.estimatedWait}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 italic border-t border-dashed border-slate-300 dark:border-slate-800">
                Please wait for your number to be called at the counter screen.
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              onClick={handlePrint}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Ticket Slip
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
