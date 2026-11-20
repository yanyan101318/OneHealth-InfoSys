import { useState, useMemo, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import {
  Search,
  Building2,
  Calendar,
  Filter,
  MoreVertical,
  FileCheck2,
  Stethoscope,
  Eye,
  UserCheck,
  RotateCcw,
  Plus,
  Pencil,
  Activity,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { isAdminUser } from '../../lib/facilityAccess'
import { useFacilityFilter } from '../../hooks/useFacilityFilter'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { facilitiesData } from '../../data/mockData'
import { dataGridDarkSx } from './yakapStyles'
import PageHeader from '../../components/layout/PageHeader'

const clientTypeOptions = [
  'All',
  'Senior Citizen',
  'PWD',
  'Indigent',
  'Regular',
  'Pregnant',
]

const yearsList = ['All', '2024', '2023', '2022']

const registeredPatientGridSx = {
  ...dataGridDarkSx,
  '& .MuiDataGrid-columnHeaderTitle': {
    ...dataGridDarkSx['& .MuiDataGrid-columnHeaderTitle'],
    whiteSpace: 'nowrap',
  },
  '& .MuiDataGrid-cell:not(:last-child)': {
    borderRight: '1px solid var(--datagrid-row-border)',
  },
}

const emptyPatientForm = {
  firstName: '',
  lastName: '',
  memberPin: '',
  birthdate: '1990-01-01',
  gender: 'Female',
  clientType: 'Regular',
  facilityId: 'bhc-poblacion',
}

const emptyScreeningForm = {
  heightCm: '',
  weightKg: '',
  bpSystolic: '',
  bpDiastolic: '',
  heartRate: '',
  respiratoryRate: '',
  temperature: '',
  bloodSugar: '',
  clinicalNotes: '',
}

function validateScreening(form) {
  const errors = {}
  const values = Object.fromEntries(
    Object.entries(form).map(([field, value]) => [field, value === '' ? NaN : Number(value)])
  )

  const validateRange = (field, label, min, max) => {
    if (!Number.isFinite(values[field]) || values[field] < min || values[field] > max) {
      errors[field] = `${label} must be between ${min} and ${max}.`
    }
  }

  const validatePositive = (field, label, max) => {
    if (!Number.isFinite(values[field]) || values[field] <= 0) {
      errors[field] = `${label} must be greater than 0.`
    } else if (values[field] > max) {
      errors[field] = `${label} must not exceed ${max}.`
    }
  }

  validatePositive('heightCm', 'Height (cm)', 250)
  validatePositive('weightKg', 'Weight (kg)', 500)
  validateRange('bpSystolic', 'Systolic BP', 50, 300)
  validateRange('bpDiastolic', 'Diastolic BP', 30, 200)
  validateRange('heartRate', 'Heart rate', 30, 250)
  validateRange('respiratoryRate', 'Respiratory rate', 5, 60)
  validateRange('temperature', 'Temperature (°C)', 30, 45)
  validateRange('bloodSugar', 'Fasting blood sugar', 20, 1000)

  for (const field of ['bpSystolic', 'bpDiastolic', 'heartRate', 'respiratoryRate']) {
    if (Number.isFinite(values[field]) && !Number.isInteger(values[field])) {
      errors[field] = 'Enter a whole number.'
    }
  }

  if (
    Number.isFinite(values.bpSystolic) &&
    Number.isFinite(values.bpDiastolic) &&
    values.bpSystolic <= values.bpDiastolic
  ) {
    errors.bpSystolic = 'Systolic BP must be greater than diastolic BP.'
    errors.bpDiastolic = 'Diastolic BP must be lower than systolic BP.'
  }

  return errors
}

export default function RegisteredYakap() {
  const { currentUser, userProfile } = useAuth()
  const isAdmin = isAdminUser(userProfile)
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFacility, setSelectedFacility] = useState(
    isAdmin ? 'All' : userProfile?.facilityId || '__unassigned__'
  )
  const [selectedYear, setSelectedYear] = useState('All')
  const [selectedClientType, setSelectedClientType] = useState('All')

  // Modals state
  const [selectedRow, setSelectedRow] = useState(null)
  const [screeningModalOpen, setScreeningModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [isSubmittingScreening, setIsSubmittingScreening] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // New Patient Form state
  const [newPatient, setNewPatient] = useState({ ...emptyPatientForm })

  useEffect(() => {
    if (!registerModalOpen) return

    if (editingPatient) {
      const [fallbackLastName, fallbackFirstName] = (editingPatient.name || '').includes(',')
        ? editingPatient.name.split(',').map((part) => part.trim())
        : ['', editingPatient.name || '']
      setNewPatient({
        firstName: editingPatient.firstName || fallbackFirstName,
        lastName: editingPatient.lastName || fallbackLastName,
        memberPin: editingPatient.memberPin || editingPatient.patientPin || '',
        birthdate: editingPatient.birthdate || '1990-01-01',
        gender: editingPatient.gender || 'Female',
        clientType: editingPatient.clientType || 'Regular',
        facilityId: editingPatient.facilityId || userProfile?.facilityId || 'bhc-poblacion',
      })
    }
  }, [registerModalOpen, editingPatient, userProfile?.facilityId])

  // Screening form state
  const [screeningForm, setScreeningForm] = useState(emptyScreeningForm)
  const [screeningErrors, setScreeningErrors] = useState({})
  const patientsCollection = useMemo(() => collection(db, 'patients'), [])
  const patientsQuery = useFacilityFilter(patientsCollection, selectedFacility)

  useEffect(() => {
    setSelectedFacility(isAdmin ? 'All' : userProfile?.facilityId || '__unassigned__')
  }, [isAdmin, userProfile?.facilityId])

  // 1. Real-time Firestore Listener
  useEffect(() => {
    if (!patientsQuery) {
      setPatients([])
      setIsLoading(false)
      return undefined
    }

    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data()
          const fullName =
            data.name ||
            (data.lastName && data.firstName
              ? `${data.lastName}, ${data.firstName}`
              : 'Unnamed Patient')
          return {
            id: d.id,
            ...data,
            name: fullName,
            facility: data.facility || data.facilityId || 'BHC Poblacion',
          }
        })
        setPatients(items)
        setIsLoading(false)
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error)
        toast.error('Real-time sync error: ' + error.message)
        setPatients([])
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [patientsQuery])

  // Filter patients client-side for search, year, and client type
  const filteredPatients = useMemo(() => {
    return patients.filter((item) => {
      // Search by Case / PIN / Name
      const term = searchTerm.toLowerCase().trim()
      const matchSearch =
        !term ||
        (item.caseNo && item.caseNo.toLowerCase().includes(term)) ||
        (item.memberPin && item.memberPin.toLowerCase().includes(term)) ||
        (item.patientPin && item.patientPin.toLowerCase().includes(term)) ||
        (item.name && item.name.toLowerCase().includes(term))

      // Year filter (based on enlistmentDate: YYYY-MM-DD)
      const matchYear =
        selectedYear === 'All' ||
        (item.enlistmentDate && item.enlistmentDate.startsWith(selectedYear))

      // Client Type filter
      const matchClientType =
        selectedClientType === 'All' || item.clientType === selectedClientType

      return matchSearch && matchYear && matchClientType
    })
  }, [patients, searchTerm, selectedYear, selectedClientType])

  const handleResetFilters = () => {
    setSearchTerm('')
    const defaultFacility = isAdmin ? 'All' : userProfile?.facilityId || '__unassigned__'
    if (selectedFacility !== defaultFacility) setIsLoading(true)
    setSelectedFacility(defaultFacility)
    setSelectedYear('All')
    setSelectedClientType('All')
    toast.info('Filters reset to default')
  }

  const handleFacilityChange = (facilityId) => {
    if (!isAdmin) return
    if (facilityId !== selectedFacility) setIsLoading(true)
    setSelectedFacility(facilityId)
  }

  // Firestore action: Generate Consent Form
  const handleGenerateConsent = async (patient) => {
    try {
      if (typeof patient.id !== 'string') {
        throw new Error('Patient record is not available in Firestore.')
      }
      const patientRef = doc(db, 'patients', patient.id)
      await updateDoc(patientRef, {
        hasConsentForm: true,
        consentGeneratedAt: new Date().toISOString(),
      })
      toast.success(`Consent Form generated successfully for ${patient.name}`)
    } catch (err) {
      console.error('Error generating consent form:', err)
      toast.error('Failed to update consent form: ' + err.message)
    }
  }

  const handleOpenScreening = (patient) => {
    setSelectedRow(patient)
    setScreeningForm({ ...emptyScreeningForm })
    setScreeningErrors({})
    setScreeningModalOpen(true)
  }

  const handleScreeningDialogChange = (open) => {
    if (!open && isSubmittingScreening) return
    setScreeningModalOpen(open)
    if (!open) {
      setScreeningForm({ ...emptyScreeningForm })
      setScreeningErrors({})
    }
  }

  const handleScreeningFieldChange = (field, value) => {
    setScreeningForm((current) => ({ ...current, [field]: value }))
    setScreeningErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === 'bpSystolic' || field === 'bpDiastolic') {
        delete next.bpSystolic
        delete next.bpDiastolic
      }
      return next
    })
  }

  const handleSaveScreening = async (e) => {
    e.preventDefault()
    if (!currentUser?.uid) {
      toast.error('You must be signed in to save a health screening.')
      return
    }
    const screeningFacilityId = isAdmin
      ? selectedRow?.facilityId
      : userProfile?.facilityId
    if (!screeningFacilityId) {
      toast.error('The patient must have an assigned facility before screening can be saved.')
      return
    }

    const errors = validateScreening(screeningForm)
    setScreeningErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmittingScreening(true)
    try {
      const heightCm = Number(screeningForm.heightCm)
      const weightKg = Number(screeningForm.weightKg)
      const bmi = Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1))
      const screeningData = {
        patientId: selectedRow?.id,
        patientName: selectedRow?.name,
        caseNo: selectedRow?.caseNo,
        screenedBy: currentUser.uid,
        facility: isAdmin
          ? selectedRow?.facility || screeningFacilityId
          : userProfile?.facility || screeningFacilityId,
        facilityId: screeningFacilityId,
        heightCm,
        weightKg,
        bmi,
        bpSystolic: Number(screeningForm.bpSystolic),
        bpDiastolic: Number(screeningForm.bpDiastolic),
        heartRate: Number(screeningForm.heartRate),
        respiratoryRate: Number(screeningForm.respiratoryRate),
        temperature: Number(screeningForm.temperature),
        bloodSugar: Number(screeningForm.bloodSugar),
        clinicalNotes: screeningForm.clinicalNotes.trim(),
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'screenings'), screeningData)

      setScreeningModalOpen(false)
      setScreeningForm({ ...emptyScreeningForm })
      setScreeningErrors({})
      toast.success('Screening saved successfully')
    } catch (err) {
      console.error('Screening save error:', err)
      toast.error('Failed to save screening to Firestore: ' + err.message)
    } finally {
      setIsSubmittingScreening(false)
    }
  }

  // Firestore action: Register New Patient
  const handleRegisterPatient = async (e) => {
    e.preventDefault()
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.memberPin) {
      toast.error('Please complete all required fields.')
      return
    }

    setIsRegistering(true)
    try {
      const assignedFacilityId = isAdmin
        ? newPatient.facilityId
        : userProfile?.facilityId
      if (!assignedFacilityId) {
        toast.error('Your account does not have an assigned facility.')
        return
      }
      const patientDoc = {
        caseNo: editingPatient?.caseNo || `CASE-${Date.now().toString().slice(-7)}`,
        memberPin: newPatient.memberPin,
        patientPin: newPatient.memberPin,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        name: `${newPatient.lastName}, ${newPatient.firstName}`,
        birthdate: newPatient.birthdate,
        gender: newPatient.gender,
        clientType: newPatient.clientType,
        enlistmentDate: new Date().toISOString().split('T')[0],
        facilityId: assignedFacilityId,
        facility: facilitiesData.find((f) => f.id === assignedFacilityId)?.name || userProfile?.facility || 'BHC Poblacion',
        status: 'Active',
        synced: false,
      }

      if (editingPatient) {
        const editablePatientData = { ...patientDoc }
        delete editablePatientData.caseNo
        delete editablePatientData.enlistmentDate
        await updateDoc(doc(db, 'patients', editingPatient.id), {
          ...editablePatientData,
          updatedAt: serverTimestamp(),
        })
        toast.success('Patient updated successfully')
      } else {
        await addDoc(collection(db, 'patients'), patientDoc)
        toast.success(`Successfully registered ${patientDoc.name} in Yakap database!`)
      }

      setRegisterModalOpen(false)
      setEditingPatient(null)
      setNewPatient({ ...emptyPatientForm })
    } catch (err) {
      console.error(editingPatient ? 'Error updating patient:' : 'Error registering patient:', err)
      toast.error(`${editingPatient ? 'Failed to update' : 'Failed to register'} patient in Firestore: ${err.message}`)
    } finally {
      setIsRegistering(false)
    }
  }

  const height = Number(screeningForm.heightCm)
  const weight = Number(screeningForm.weightKg)
  const calculatedBmi =
    height > 0 && weight > 0 ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : null
  const bmiColor =
    calculatedBmi === null
      ? 'text-slate-500 dark:text-slate-400'
      : calculatedBmi >= 30
        ? 'text-red-600 dark:text-red-400'
        : calculatedBmi >= 25
          ? 'text-yellow-600 dark:text-yellow-400'
          : calculatedBmi >= 18.5
            ? 'text-green-600 dark:text-green-400'
            : 'text-amber-600 dark:text-amber-400'

  const renderScreeningNumberField = (field, label, { min, max, step = '1', unit } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`screening-${field}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{unit ? ` (${unit})` : ''}
      </Label>
      <Input
        id={`screening-${field}`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={screeningForm[field]}
        onChange={(event) => handleScreeningFieldChange(field, event.target.value)}
        aria-invalid={Boolean(screeningErrors[field])}
        aria-describedby={screeningErrors[field] ? `screening-${field}-error` : undefined}
        className="h-9 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {screeningErrors[field] && (
        <p id={`screening-${field}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {screeningErrors[field]}
        </p>
      )}
    </div>
  )

  const columns = [
    {
      field: 'caseNo',
      headerName: 'Case No',
      width: 95,
      renderCell: (params) => (
        <span className="font-mono text-xs font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700">
          {params.value}
        </span>
      ),
    },
    {
      field: 'memberPin',
      headerName: 'Member PIN',
      width: 100,
      renderCell: (params) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{params.value}</span>
      ),
    },
    {
      field: 'patientPin',
      headerName: 'Patient PIN',
      width: 100,
      renderCell: (params) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-400">{params.value}</span>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <div
          className="flex flex-col justify-center py-1 w-full overflow-hidden"
          title={params.value || ''}
        >
          <span
            className="font-medium text-slate-900 dark:text-white text-sm leading-snug truncate"
            title={params.value || ''}
          >
            {params.value}
          </span>
          <span
            className="text-xs text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5"
            title={params.row.facility || ''}
          >
            {params.row.facility}
          </span>
        </div>
      ),
    },
    {
      field: 'birthdate',
      headerName: 'Birthdate',
      width: 110,
      renderCell: (params) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{params.value}</span>
      ),
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 80,
      renderCell: (params) => (
        <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 text-xs border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
          {params.value}
        </span>
      ),
    },
    {
      field: 'clientType',
      headerName: 'Client Type',
      width: 120,
      renderCell: (params) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
          {params.value}
        </span>
      ),
    },
    {
      field: 'enlistmentDate',
      headerName: 'Enlisted',
      width: 95,
      renderCell: (params) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-400">{params.value}</span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      minWidth: 100,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white border-slate-200 text-slate-900 shadow-lg dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
              <DropdownMenuLabel className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Client Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setEditingPatient(row)
                  setSelectedRow(row)
                  setRegisterModalOpen(true)
                }}
                className="cursor-pointer gap-2 focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
              >
                <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Edit Patient</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleGenerateConsent(row)}
                className="cursor-pointer gap-2 focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
              >
                <FileCheck2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Generate Consent Form</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenScreening(row)}
                className="cursor-pointer gap-2 focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
              >
                <Stethoscope className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Health Screening</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRow(row)
                  setDetailsModalOpen(true)
                }}
                className="cursor-pointer gap-2 focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-white"
              >
                <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>View Full Details</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registered Patients"
        subtitle="Directory of enrolled beneficiaries"
        icon={UserCheck}
        actions={(
          <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700">
            Total Shown: <span className="ml-1 font-bold text-blue-700 dark:text-blue-400">{filteredPatients.length}</span>
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              setEditingPatient(null)
              setNewPatient({ ...emptyPatientForm })
              setRegisterModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </Button>
          </div>
        )}
      />

      {/* Advanced Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4 dark:bg-[#1e293b] dark:border-slate-700/80 dark:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by Case No, PIN, or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Facility filter is available only to admins. */}
          {isAdmin ? (
          <div className="md:col-span-3">
            <Select value={selectedFacility} onValueChange={handleFacilityChange}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <Building2 className="w-4 h-4 text-slate-400 mr-2" />
                <SelectValue placeholder="Facility" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                <SelectItem value="All">All Facilities</SelectItem>
                {facilitiesData
                  .filter((f) => f.id !== 'all')
                  .map((fac) => (
                    <SelectItem key={fac.id} value={fac.id}>
                      {fac.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 md:col-span-3">
              <Building2 className="h-4 w-4 text-slate-400" />
              {userProfile?.facility || 'No assigned facility'}
            </div>
          )}

          {/* Year Dropdown */}
          <div className="md:col-span-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                {yearsList.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y === 'All' ? 'All Years' : y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="md:col-span-2 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="w-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Client Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Client Type:
          </span>
          {clientTypeOptions.map((type) => {
            const isSelected = selectedClientType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedClientType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* MUI DataGrid Table with Skeleton Loading */}
      {isLoading ? (
        <div className="space-y-3 p-4 rounded-xl bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="h-[550px] w-full">
          <DataGrid
            rows={filteredPatients}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            rowHeight={60}
            sx={registeredPatientGridSx}
          />
        </div>
      )}

      {/* Register New Patient Dialog */}
      <Dialog
        open={registerModalOpen}
        onOpenChange={(open) => {
          setRegisterModalOpen(open)
          if (!open) setEditingPatient(null)
        }}
      >
        <DialogContent className="max-w-lg bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Plus className="w-5 h-5 text-blue-400" />
              {editingPatient ? 'Edit Yakap Patient' : 'Register New Yakap Patient'}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300 text-xs">
              Directly enroll beneficiary into Firestore database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterPatient} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">First Name *</Label>
                <Input
                  required
                  placeholder="e.g. Maria"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">Last Name *</Label>
                <Input
                  required
                  placeholder="e.g. Santos"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">PhilHealth Member PIN *</Label>
                <Input
                  required
                  placeholder="12-digit PIN"
                  value={newPatient.memberPin}
                  onChange={(e) => setNewPatient({ ...newPatient, memberPin: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-9 text-xs font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">Birthdate</Label>
                <Input
                  type="date"
                  value={newPatient.birthdate}
                  onChange={(e) => setNewPatient({ ...newPatient, birthdate: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">Gender</Label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(val) => setNewPatient({ ...newPatient, gender: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">Client Type</Label>
                <Select
                  value={newPatient.clientType}
                  onValueChange={(val) => setNewPatient({ ...newPatient, clientType: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                    {clientTypeOptions
                      .filter((t) => t !== 'All')
                      .map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 dark:text-slate-300">Facility</Label>
                {isAdmin ? (
                  <Select
                    value={newPatient.facilityId}
                    onValueChange={(val) => setNewPatient({ ...newPatient, facilityId: val })}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-9 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                      {facilitiesData
                        .filter((f) => f.id !== 'all')
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-9 items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {userProfile?.facility || 'No assigned facility'}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegisterModalOpen(false)}
                  className="border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRegistering}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isRegistering ? (editingPatient ? 'Updating...' : 'Registering...') : editingPatient ? 'Update Patient' : 'Complete Enrollment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Health Screening Dialog */}
      <Dialog open={screeningModalOpen} onOpenChange={handleScreeningDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Health Screening
            </DialogTitle>
            <DialogDescription className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="block text-base font-semibold text-slate-900 dark:text-slate-100">
                {selectedRow?.name || 'Selected patient'}
              </span>
              <span className="mt-1 block font-mono text-sm text-slate-600 dark:text-slate-300">
                Case No: {selectedRow?.caseNo || '—'}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveScreening} noValidate className="space-y-4 py-2">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Anthropometric</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {renderScreeningNumberField('heightCm', 'Height', { min: '0', max: '250', step: '0.1', unit: 'cm' })}
                {renderScreeningNumberField('weightKg', 'Weight', { min: '0', max: '500', step: '0.1', unit: 'kg' })}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="screening-bmi" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    BMI (kg/m²)
                  </Label>
                  <Input
                    id="screening-bmi"
                    readOnly
                    value={calculatedBmi ?? ''}
                    aria-label="Calculated BMI"
                    className={`h-9 border-slate-300 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-800 ${bmiColor}`}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vital Signs</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Blood Pressure (mmHg)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {renderScreeningNumberField('bpSystolic', 'Systolic', { min: '50', max: '300' })}
                    {renderScreeningNumberField('bpDiastolic', 'Diastolic', { min: '30', max: '200' })}
                  </div>
                </div>
                {renderScreeningNumberField('heartRate', 'Heart Rate', { min: '30', max: '250', unit: 'BPM' })}
                {renderScreeningNumberField('respiratoryRate', 'Respiratory Rate', { min: '5', max: '60', unit: 'breaths/min' })}
                {renderScreeningNumberField('temperature', 'Temperature', { min: '30', max: '45', step: '0.1', unit: '°C' })}
                {renderScreeningNumberField('bloodSugar', 'Fasting Blood Sugar', { min: '20', max: '1000', step: '0.1', unit: 'mg/dL' })}
              </div>
            </section>

            <section className="space-y-1.5">
              <Label htmlFor="screening-clinical-notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Clinical Notes
              </Label>
              <textarea
                id="screening-clinical-notes"
                rows={3}
                value={screeningForm.clinicalNotes}
                onChange={(event) => handleScreeningFieldChange('clinicalNotes', event.target.value)}
                placeholder="Add observations or clinical notes..."
                className="w-full resize-y rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </section>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingScreening}
                onClick={() => handleScreeningDialogChange(false)}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingScreening}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isSubmittingScreening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmittingScreening ? 'Saving...' : 'Save Screening Result'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient Profile View Details Dialog */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-lg dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Patient Profile
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              PhilHealth Yakap Registered Case Information
            </DialogDescription>
          </DialogHeader>

          {selectedRow && (
            <div className="py-1">
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Full Name</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{selectedRow.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Case Number</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline text-sm">{selectedRow.caseNo}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 dark:text-slate-400 text-sm">PhilHealth Member PIN</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100 text-sm">{selectedRow.memberPin}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Client Category</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{selectedRow.clientType}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Registered Facility</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{selectedRow.facility}</span>
              </div>
              <div className="flex justify-between items-center py-3 last:border-0">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Enlistment Date</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{selectedRow.enlistmentDate}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setDetailsModalOpen(false)}
              className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
