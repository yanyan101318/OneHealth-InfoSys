import { useState, useMemo, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import {
  UploadCloud,
  Search,
  CheckCircle,
  Clock,
  ShieldCheck,
  Users,
  FileX2,
  RotateCcw,
  UserCheck,
  Send,
  MoreVertical,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu'
import { mockPhilhealthList } from '../../data/mockData'
import { dataGridDarkSx } from './yakapStyles'
import PageHeader from '../../components/layout/PageHeader'

export default function PhilhealthMasterList() {
  const [list, setList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [memberTypeFilter, setMemberTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isUploading, setIsUploading] = useState(false)

  // 1. Real-time Subscription to philhealth_members
  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, 'philhealth_members'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items = []
          snapshot.forEach((d) => {
            const data = d.data()
            const fullName =
              data.name ||
              (data.lastName && data.firstName
                ? `${data.lastName}, ${data.firstName} ${data.middleName ? data.middleName + '.' : ''}`
                : 'Unnamed Member')
            items.push({
              id: d.id,
              ...data,
              memberPin: data.registeredPin || data.memberPin,
              name: fullName,
              gender: data.sex || data.gender || 'Female',
              birthdate: data.dateOfBirth || data.birthdate || '1980-01-01',
              memberType: data.clientType || data.memberType || 'Principal',
              validityDate: data.effectivityYear ? `${data.effectivityYear}-12-31` : '2025-12-31',
              uploaded: Boolean(data.uploaded),
            })
          })
          setList(items)
        } else {
          setList(mockPhilhealthList)
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Error fetching philhealth_members:', error)
        toast.error('Failed to connect to PhilHealth Master List: ' + error.message)
        setList(mockPhilhealthList)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Filtered rows
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const term = searchTerm.toLowerCase().trim()
      const matchSearch =
        !term ||
        (item.memberPin && item.memberPin.toLowerCase().includes(term)) ||
        (item.name && item.name.toLowerCase().includes(term))

      const matchType =
        memberTypeFilter === 'All' || item.memberType === memberTypeFilter

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Uploaded' && item.uploaded) ||
        (statusFilter === 'Pending' && !item.uploaded)

      return matchSearch && matchType && matchStatus
    })
  }, [list, searchTerm, memberTypeFilter, statusFilter])

  // Bulk Upload Action to Firestore
  const handleUploadSelected = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select at least one member to upload.')
      return
    }

    setIsUploading(true)
    const count = selectedIds.length

    try {
      const batch = writeBatch(db)
      let firestoreCount = 0

      selectedIds.forEach((id) => {
        if (typeof id === 'string') {
          const docRef = doc(db, 'philhealth_members', id)
          batch.update(docRef, { uploaded: true, uploadedAt: new Date().toISOString() })
          firestoreCount++
        }
      })

      if (firestoreCount > 0) {
        await batch.commit()
      }

      // Add audit sync log
      await addDoc(collection(db, 'sync_logs'), {
        userId: 'admin',
        timestamp: new Date().toISOString(),
        recordsSynced: count,
        status: 'success',
      }).catch(() => {})

      // Update local state if items weren't in Firestore yet
      setList((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id) ? { ...item, uploaded: true } : item
        )
      )

      setSelectedIds([])
      toast.success(`Successfully uploaded ${count} member(s) to PhilHealth central server!`)
    } catch (err) {
      console.error('Bulk upload error:', err)
      toast.error('Bulk upload failed: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  // Single Upload Action to Firestore
  const handleUploadSingle = async (id, name) => {
    try {
      if (typeof id === 'string') {
        const docRef = doc(db, 'philhealth_members', id)
        await updateDoc(docRef, { uploaded: true, uploadedAt: new Date().toISOString() })
      }
      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, uploaded: true } : item))
      )
      toast.success(`Uploaded ${name} to PhilHealth server`)
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    }
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setMemberTypeFilter('All')
    setStatusFilter('All')
    toast.info('Filters cleared')
  }

  const columns = [
    {
      field: 'memberPin',
      headerName: 'PhilHealth PIN',
      width: 155,
      renderCell: (params) => (
        <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-700/60">
          {params.value}
        </span>
      ),
    },
    {
      field: 'name',
      headerName: 'Member Full Name',
      flex: 2,
      minWidth: 250,
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
          <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
            DOB: {params.row.birthdate}
          </span>
        </div>
      ),
    },
    {
      field: 'gender',
      headerName: 'Sex',
      width: 90,
      renderCell: (params) => (
        <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 text-xs border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          {params.value}
        </span>
      ),
    },
    {
      field: 'memberType',
      headerName: 'Member Type',
      width: 130,
      renderCell: (params) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          {params.value}
        </span>
      ),
    },
    {
      field: 'validityDate',
      headerName: 'Coverage Validity',
      width: 140,
      renderCell: (params) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">{params.value}</span>
      ),
    },
    {
      field: 'uploaded',
      headerName: 'Cloud Status',
      width: 145,
      renderCell: (params) => (
        <div className="flex items-center gap-1.5">
          {params.value ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Uploaded</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Upload</span>
            </>
          )}
        </div>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const row = params.row
        return (
          <div className="flex items-center gap-1">
            {!row.uploaded ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUploadSingle(row.id, row.name)}
                className="h-7 px-2 text-[11px] bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:text-white"
              >
                <Send className="w-3 h-3 mr-1 text-slate-500 dark:text-slate-400" />
                Upload
              </Button>
            ) : (
              <span className="text-xs text-slate-500 italic">Synced</span>
            )}
          </div>
        )
      },
    },
  ]

  const totalUploaded = list.filter((i) => i.uploaded).length
  const totalPending = list.length - totalUploaded

  return (
    <div className="space-y-5">
      <PageHeader
        title="PhilHealth Master List"
        subtitle="National health insurance registry and bulk upload status"
        icon={ShieldCheck}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Total Members:</span>{' '}
            <span className="font-bold text-slate-800 dark:text-slate-100">{list.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Uploaded:</span>{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalUploaded}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Pending:</span>{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPending}</span>
          </div>
          </div>
        )}
      />

      {/* Advanced Filter & Bulk Action Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 dark:bg-[#1e293b] dark:border-slate-700/80 dark:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by PIN or Full Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Member Type Filter */}
          <div className="md:col-span-2">
            <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Member Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Principal">Principal</SelectItem>
                <SelectItem value="Dependent">Dependent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Uploaded">Uploaded</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Upload Button */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleUploadSelected}
              disabled={isUploading || selectedIds.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading to PhilHealth...' : `Upload Selected (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      </div>

      {/* MUI DataGrid Table with Checkboxes */}
      {isLoading ? (
        <div className="space-y-3 p-4 rounded-xl bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="h-[550px] w-full">
          <DataGrid
            rows={filteredList}
            columns={columns}
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => {
              setSelectedIds(newSelection)
            }}
            rowSelectionModel={selectedIds}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            rowHeight={60}
            sx={dataGridDarkSx}
          />
        </div>
      )}
    </div>
  )
}
