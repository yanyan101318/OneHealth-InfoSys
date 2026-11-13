import { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  RefreshCw,
  FileCheck,
  Table,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { reportCategories, facilitiesData } from '../../data/mockData'
import PageHeader from '../../components/layout/PageHeader'

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('registration')
  const [selectedTitle, setSelectedTitle] = useState('monthly-reg')
  const [selectedFacility, setSelectedFacility] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q4')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState(null)

  // Dependent Report Title options
  const currentCategoryObj = useMemo(() => {
    return reportCategories.find((c) => c.id === selectedCategory) || reportCategories[0]
  }, [selectedCategory])

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    const cat = reportCategories.find((c) => c.id === categoryId)
    if (cat && cat.titles.length > 0) {
      setSelectedTitle(cat.titles[0].id)
    }
  }

  const handleGenerate = () => {
    setIsGenerating(true)

    const titleObj = currentCategoryObj.titles.find((t) => t.id === selectedTitle)
    const reportName = titleObj ? titleObj.name : 'Report'

    setTimeout(() => {
      setIsGenerating(false)

      // Create realistic preview mock data based on selected category & title
      const mockRows = [
        {
          id: 1,
          facility: 'BHC Poblacion',
          metric1: 184,
          metric2: 168,
          rate: '91.3%',
          status: 'Compliant',
        },
        {
          id: 2,
          facility: 'BHC San Isidro',
          metric1: 142,
          metric2: 125,
          rate: '88.0%',
          status: 'Compliant',
        },
        {
          id: 3,
          facility: 'BHC Sta. Cruz',
          metric1: 120,
          metric2: 98,
          rate: '81.6%',
          status: 'Review Needed',
        },
        {
          id: 4,
          facility: 'BHC Bagumbayan',
          metric1: 95,
          metric2: 89,
          rate: '93.6%',
          status: 'Compliant',
        },
        {
          id: 5,
          facility: 'RHU Main Center',
          metric1: 210,
          metric2: 195,
          rate: '92.8%',
          status: 'Compliant',
        },
      ]

      setGeneratedReport({
        title: reportName,
        category: currentCategoryObj.name,
        facility: facilitiesData.find((f) => f.id === selectedFacility)?.name || 'All Facilities',
        period: selectedPeriod,
        generatedAt: new Date().toLocaleString(),
        totalRecords: 751,
        complianceRate: '89.4%',
        rows: mockRows,
      })

      toast.success(`Report "${reportName}" generated successfully!`)
    }, 850)
  }

  const handleExportPDF = () => {
    if (!generatedReport) return
    toast.info(`Preparing PDF export for "${generatedReport.title}"...`)
    setTimeout(() => {
      toast.success('PDF document compiled and downloaded to your computer.')
    }, 800)
  }

  const handleExportExcel = () => {
    if (!generatedReport) return
    toast.info(`Generating XLSX spreadsheet for "${generatedReport.title}"...`)
    setTimeout(() => {
      toast.success('Excel workbook (.xlsx) exported successfully.')
    }, 700)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yakap Reports"
        subtitle="Generate compliance summaries, service utilization, and enrollment analytics"
        icon={FileSpreadsheet}
      />

      {/* Control Panel: Dependent Dropdowns & Filters */}
      <Card className="bg-white border-slate-200 shadow-sm dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-md">
        <CardHeader className="p-6 pb-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Report Parameters & Configuration
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Report Category</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                  {reportCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Dependent Report Title Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Report Title</label>
              <Select value={selectedTitle} onValueChange={setSelectedTitle}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                  {currentCategoryObj.titles.map((title) => (
                    <SelectItem key={title.id} value={title.id}>
                      {title.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Facility Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Facility</label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" />
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                  {facilitiesData.map((fac) => (
                    <SelectItem key={fac.id} value={fac.id}>
                      {fac.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Reporting Period */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Reporting Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" />
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
                  <SelectItem value="2024-Q4">Q4 2024 (Oct - Dec)</SelectItem>
                  <SelectItem value="2024-Q3">Q3 2024 (Jul - Sep)</SelectItem>
                  <SelectItem value="2024-Annual">Full Year 2024</SelectItem>
                  <SelectItem value="2023-Annual">Full Year 2023</SelectItem>
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

      {/* Report Preview Placeholder Area / Active Preview */}
      {!generatedReport && !isGenerating && (
        <div className="p-16 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3 dark:bg-[#1e293b]/60 dark:border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Table className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">
            Report Preview Placeholder
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Select a report category and specific report title above, configure the facility and time period,
            then click <strong>Generate Report</strong> to inspect data and download PDF or Excel spreadsheets.
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="p-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-3 text-center dark:bg-[#1e293b] dark:border-slate-700">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Aggregating clinical records and computing metrics...
          </p>
        </div>
      )}

      {generatedReport && !isGenerating && (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden dark:bg-[#1e293b] dark:border-slate-700 dark:shadow-xl">
          {/* Header Bar with Action Buttons */}
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {generatedReport.category}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  Ready for Export
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {generatedReport.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Facility: <span className="text-slate-900 dark:text-slate-200 font-medium">{generatedReport.facility}</span> • Period:{' '}
                <span className="text-slate-900 dark:text-slate-200 font-medium">{generatedReport.period}</span> • Generated on:{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">{generatedReport.generatedAt}</span>
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                className="border-slate-200 bg-white text-emerald-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export Excel
              </Button>
              <Button
                size="sm"
                onClick={handleExportPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400">Total Enrolled Population</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {generatedReport.totalRecords.toLocaleString()}
                </p>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">+11.2% over target</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400">Overall Compliance Benchmark</span>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                  {generatedReport.complianceRate}
                </p>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">PhilHealth accreditation threshold met</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400">Active Reporting Units</span>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">5 Facilities</p>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">100% submission rate</span>
              </div>
            </div>

            {/* Preview Data Table */}
            <div className="rounded-lg border border-slate-200 overflow-hidden dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Reporting Facility</th>
                    <th className="py-3 px-4">Target Enrollees</th>
                    <th className="py-3 px-4">Accomplished</th>
                    <th className="py-3 px-4">Fulfillment %</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
                  {generatedReport.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{row.facility}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{row.metric1}</td>
                      <td className="py-3 px-4 text-blue-700 dark:text-blue-400 font-medium">{row.metric2}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{row.rate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {row.status}
                        </span>
                      </td>
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
