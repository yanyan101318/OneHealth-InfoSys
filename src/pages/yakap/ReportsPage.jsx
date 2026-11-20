import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Calendar,
  Download,
  FileCheck,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Sparkles,
  Table,
} from 'lucide-react'
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useFacilityFilter } from '../../hooks/useFacilityFilter'
import { useAuth } from '../../context/AuthContext'
import { isAdminUser } from '../../lib/facilityAccess'
import { db } from '../../lib/firebase'
import { reportCategories } from '../../data/mockData'
import PageHeader from '../../components/layout/PageHeader'

const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

function toInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCellValue(value) {
  if (value == null) return ''
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getExportRows(rows) {
  return rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, formatCellValue(value)])
  ))
}

async function generatePDF(data, reportTitle, facilityName) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(18)
  doc.text('OneHealth InfoSys', 14, 18)
  doc.setFontSize(13)
  doc.text(reportTitle, 14, 27)
  doc.setFontSize(10)
  doc.text(`Facility: ${facilityName}`, 14, 34)
  doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 41)

  const columns = [...new Set(data.flatMap((row) => Object.keys(row)))]
  autoTable(doc, {
    startY: 47,
    head: [columns],
    body: data.map((row) => columns.map((column) => row[column] ?? '')),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175] },
  })

  doc.save(`${reportTitle}.pdf`)
}

async function generateExcel(data, reportTitle) {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, `${reportTitle}.xlsx`)
}

function getReportCollection(categoryId, titleId) {
  if (categoryId === 'health' && titleId === 'screening') return 'screenings'
  if (categoryId === 'philhealth') return 'philhealth_members'
  return 'patients'
}

function getSafeFileName(value) {
  return value.trim().replace(/[<>:"/\\|?*]+/g, '-').replace(/\s+/g, '_') || 'Report'
}

export default function ReportsPage() {
  const { currentUser, userProfile } = useAuth()
  const isAdmin = isAdminUser(userProfile)
  const [selectedCategory, setSelectedCategory] = useState('registration')
  const [selectedTitle, setSelectedTitle] = useState('monthly-reg')
  const [selectedFacility, setSelectedFacility] = useState('all')
  const [startDate, setStartDate] = useState(toInputDate(firstDayOfMonth))
  const [endDate, setEndDate] = useState(toInputDate(today))
  const [exportFormat, setExportFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState(null)
  const [facilities, setFacilities] = useState([])

  const patientsCollection = useMemo(() => collection(db, 'patients'), [])
  const screeningsCollection = useMemo(() => collection(db, 'screenings'), [])
  const membersCollection = useMemo(() => collection(db, 'philhealth_members'), [])
  const patientsQuery = useFacilityFilter(patientsCollection, selectedFacility)
  const screeningsQuery = useFacilityFilter(screeningsCollection, selectedFacility)
  const membersQuery = useFacilityFilter(membersCollection, selectedFacility)

  const currentCategory = useMemo(
    () => reportCategories.find((category) => category.id === selectedCategory) || reportCategories[0],
    [selectedCategory]
  )
  const titleOption = currentCategory.titles.find((title) => title.id === selectedTitle)
  const reportTitle = titleOption?.name || currentCategory.name
  const facilityName = isAdmin
    ? selectedFacility === 'all'
      ? 'All Facilities'
      : facilities.find((facility) => facility.id === selectedFacility)?.name || selectedFacility
    : userProfile?.facility || userProfile?.facilityId || 'Assigned facility'

  useEffect(() => {
    let active = true
    if (!isAdmin) {
      setFacilities(userProfile?.facilityId
        ? [{ id: userProfile.facilityId, name: userProfile.facility || userProfile.facilityId }]
        : [])
      if (userProfile?.facilityId) setSelectedFacility(userProfile.facilityId)
      return () => { active = false }
    }

    getDocs(collection(db, 'facilities'))
      .then((snapshot) => {
        if (active) {
          setFacilities(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })))
        }
      })
      .catch((error) => {
        if (!active) return
        console.error('Failed to load report facilities:', error)
        toast.error(`Unable to load facilities: ${error.message}`)
      })
    return () => { active = false }
  }, [isAdmin, userProfile?.facility, userProfile?.facilityId])

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    const category = reportCategories.find((item) => item.id === categoryId)
    setSelectedTitle(category?.titles[0]?.id || '')
    setGeneratedReport(null)
  }

  const handleGenerate = async () => {
    if (!currentUser?.uid || !userProfile) {
      toast.error('Your account profile is not ready. Please try again.')
      return
    }
    if (!startDate || !endDate || startDate > endDate) {
      toast.error('Choose a valid reporting date range.')
      return
    }

    const reportCollections = {
      patients: patientsQuery,
      screenings: screeningsQuery,
      philhealth_members: membersQuery,
    }
    const facilityScopedQuery = reportCollections[getReportCollection(selectedCategory, selectedTitle)]
    if (!facilityScopedQuery) {
      toast.error('Unable to build a facility-scoped report query.')
      return
    }

    setIsGenerating(true)
    setGeneratedReport(null)
    try {
      const start = new Date(`${startDate}T00:00:00`)
      const end = new Date(`${endDate}T23:59:59.999`)
      const reportQuery = query(
        facilityScopedQuery,
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      )
      const snapshot = await getDocs(reportQuery)
      if (snapshot.empty) {
        toast.info('No data found for the selected filters.')
        return
      }

      const rows = getExportRows(snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })))
      const report = {
        title: reportTitle,
        category: currentCategory.name,
        facility: facilityName,
        period: `${startDate} to ${endDate}`,
        generatedAt: new Date().toLocaleString(),
        rows,
        columns: [...new Set(rows.flatMap((row) => Object.keys(row)))],
      }
      setGeneratedReport(report)
      const safeTitle = getSafeFileName(reportTitle)
      if (exportFormat === 'pdf') {
        await generatePDF(rows, safeTitle, facilityName)
      } else {
        await generateExcel(rows, safeTitle)
      }
      toast.success(`Report "${reportTitle}" generated and downloaded as ${exportFormat.toUpperCase()}.`)
    } catch (error) {
      console.error('Report generation failed:', error)
      toast.error(`Unable to generate report: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async (format) => {
    if (!generatedReport) return
    try {
      const safeTitle = getSafeFileName(generatedReport.title)
      if (format === 'pdf') {
        await generatePDF(generatedReport.rows, safeTitle, generatedReport.facility)
      } else {
        await generateExcel(generatedReport.rows, safeTitle)
      }
      toast.success(`Report exported as ${format.toUpperCase()}.`)
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error)
      toast.error(`Unable to export report: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yakap Reports"
        subtitle="Generate facility-scoped registration and health service reports"
        icon={FileSpreadsheet}
      />

      <Card className="bg-white border-slate-200 shadow-sm dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-md">
        <CardHeader className="p-6 pb-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Report Parameters & Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Report Category</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {reportCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Report Title</label>
              <Select value={selectedTitle} onValueChange={setSelectedTitle}>
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {currentCategory.titles.map((title) => (
                    <SelectItem key={title.id} value={title.id}>{title.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Facility</label>
              {isAdmin ? (
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Facilities" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <SelectItem value="all">All Facilities</SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>{facility.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  {facilityName}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-start-date" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  id="report-start-date"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-end-date" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                End Date
              </label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  id="report-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Choose format" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!generatedReport && !isGenerating && (
        <div className="p-16 rounded-xl bg-white border border-slate-200 text-center space-y-3 dark:bg-[#1e293b]/60 dark:border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Table className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">No report generated</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Choose the report category, facility, date range, and export format, then generate the report.
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="p-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-3 text-center dark:bg-[#1e293b] dark:border-slate-700">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Fetching facility-scoped records and preparing your export...
          </p>
        </div>
      )}

      {generatedReport && !isGenerating && (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden dark:bg-[#1e293b] dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{generatedReport.category}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{generatedReport.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Facility: <span className="font-medium">{generatedReport.facility}</span>
                {' · '}Period: <span className="font-medium">{generatedReport.period}</span>
                {' · '}Generated: {generatedReport.generatedAt}
                {' · '}{generatedReport.rows.length.toLocaleString()} records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport('excel')} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <Download className="w-4 h-4" /> Export Excel
              </Button>
              <Button size="sm" onClick={() => handleExport('pdf')} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Download className="w-4 h-4" /> Export PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="rounded-lg border border-slate-200 overflow-auto dark:border-slate-700">
              <table className="w-full bg-white text-left text-xs dark:bg-[#1e293b]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    {generatedReport.columns.map((column) => (
                      <th key={column} className="py-3 px-4 whitespace-nowrap">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700 dark:divide-slate-800 dark:bg-[#1e293b] dark:text-slate-200">
                  {generatedReport.rows.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {generatedReport.columns.map((column) => (
                        <td key={column} className="py-3 px-4 max-w-xs truncate">{row[column]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
