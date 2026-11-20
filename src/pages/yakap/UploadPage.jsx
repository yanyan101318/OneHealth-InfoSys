import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileCode,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Download,
  CloudUpload,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  collection,
  writeBatch,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { getFacilityFilter, isAdminUser } from '../../lib/facilityAccess'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/layout/PageHeader'

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('The selected file could not be read as text.'))
      }
    }
    reader.onerror = () => reject(reader.error || new Error('Unable to read the selected file.'))
    reader.onabort = () => reject(new Error('Reading the selected file was cancelled.'))
    reader.readAsText(file)
  })
}

function getElementsByLocalName(parent, localName) {
  return Array.from(parent.getElementsByTagName('*')).filter((element) => element.localName === localName)
}

function getRequiredText(parent, tagName, context) {
  const element = getElementsByLocalName(parent, tagName)[0]
  const value = element?.textContent?.trim()
  if (!value) {
    throw new Error(`Missing required <${tagName}> value in ${context}.`)
  }
  return value
}

function parseYakapXML(xmlString) {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
  if (getElementsByLocalName(xmlDoc, 'parsererror').length > 0) {
    throw new Error('Malformed XML. Please check the file and try again.')
  }

  const headerNode = getElementsByLocalName(xmlDoc, 'header')[0]
  if (!headerNode) {
    throw new Error('Missing required <header> section.')
  }
  const header = {
    facilityId: getRequiredText(headerNode, 'facilityId', 'header'),
    batchDate: getRequiredText(headerNode, 'batchDate', 'header'),
    version: getRequiredText(headerNode, 'version', 'header'),
  }

  const patientNodes = getElementsByLocalName(xmlDoc, 'patient')
  if (patientNodes.length === 0) {
    throw new Error('The XML file contains no <patient> records.')
  }

  const patients = []
  const skipped = []

  patientNodes.forEach((node, index) => {
    const context = `patient ${index + 1}`
    try {
      const memberPin = getRequiredText(node, 'memberPin', context)
      const lastName = getRequiredText(node, 'lastName', context)
      const firstName = getRequiredText(node, 'firstName', context)
      patients.push({
        caseNo: getRequiredText(node, 'caseNo', context),
        memberPin,
        patientPin: memberPin,
        lastName,
        firstName,
        name: `${lastName}, ${firstName}`,
        birthdate: getRequiredText(node, 'birthdate', context),
        gender: getRequiredText(node, 'gender', context),
        clientType: getRequiredText(node, 'clientType', context),
        facilityId: getRequiredText(node, 'facilityId', context),
        enlistmentDate: header.batchDate,
        status: 'Active',
        synced: true,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      skipped.push({ row: index + 1, reason: error.message })
    }
  })

  return { header, patients, skipped, totalRecords: patientNodes.length }
}

async function parseAndIngestXML(file, currentUser, userProfile) {
  let recordsIngested = 0
  let recordsSkipped = 0
  let recordsFailed = 0
  let totalRecords = 0
  const uploadedBy = currentUser?.displayName || currentUser?.email || 'Unknown user'
  const isAdmin = isAdminUser(userProfile)
  let facilityId = userProfile?.facilityId || (isAdmin ? '__admin__' : '__unassigned__')

  try {
    const xmlString = await readFileAsText(file)
    const { header, patients, skipped, totalRecords: parsedRecords } = parseYakapXML(xmlString)
    if (!isAdmin && !userProfile?.facilityId) {
      throw new Error('Your account does not have an assigned facility.')
    }
    facilityId = isAdmin ? header.facilityId : userProfile.facilityId
    recordsSkipped = skipped.length
    totalRecords = parsedRecords

    for (let start = 0; start < patients.length; start += 500) {
      const patientBatch = writeBatch(db)
      patients.slice(start, start + 500).forEach((patient) => {
        patientBatch.set(doc(collection(db, 'patients')), {
          ...patient,
          facilityId,
        })
      })
      await patientBatch.commit()
      recordsIngested += Math.min(500, patients.length - start)
    }

    const summary = {
      fileName: file.name,
      status: recordsSkipped > 0 ? 'Partial' : 'Success',
      recordsIngested,
      recordsSkipped,
      recordsFailed: 0,
      uploadedBy,
      uploadedByUid: currentUser?.uid || '',
      facilityId,
      timestamp: serverTimestamp(),
      ...header,
    }
    await addDoc(collection(db, 'ingestion_logs'), summary)

    return { recordsIngested, recordsSkipped }
  } catch (error) {
    recordsFailed = Math.max(0, totalRecords - recordsIngested - recordsSkipped)

    try {
      await addDoc(collection(db, 'ingestion_logs'), {
        fileName: file.name,
        status: recordsIngested > 0 ? 'Partial' : 'Failed',
        recordsIngested,
        recordsSkipped,
        recordsFailed,
        uploadedBy,
        uploadedByUid: currentUser?.uid || '',
        facilityId,
        timestamp: serverTimestamp(),
        error: error.message || 'XML ingestion failed.',
      })
    } catch (logError) {
      console.error('Failed to write the failed-ingestion log:', logError)
      const ingestionError = new Error(
        `${error.message || 'XML ingestion failed.'} The ingestion log could not be saved: ${logError.message}`
      )
      ingestionError.recordsIngested = recordsIngested
      throw ingestionError
    }
    error.recordsIngested = recordsIngested
    throw error
  }
}

export default function UploadPage() {
  const { currentUser, userProfile } = useAuth()
  const [logs, setLogs] = useState([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const logsCollection = collection(db, 'ingestion_logs')
    const facilityFilter = getFacilityFilter(userProfile)
    const q = facilityFilter
      ? query(logsCollection, facilityFilter, orderBy('timestamp', 'desc'), limit(50))
      : query(logsCollection, orderBy('timestamp', 'desc'), limit(50))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setIsLoadingLogs(false)
      },
      (error) => {
        console.error('Ingestion logs listener failed:', error)
        toast.error('Unable to load recent ingestion logs.')
        setIsLoadingLogs(false)
      }
    )
    return () => unsubscribe()
  }, [userProfile])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      validateAndSelectFile(files[0])
    }
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndSelectFile(files[0])
      e.target.value = ''
    }
  }

  const validateAndSelectFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast.error('Invalid file format. Only XML files (.xml) are accepted.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('The XML file exceeds the 25MB size limit.')
      return
    }
    setSelectedFile(file)
  }

  const handleStartUpload = async () => {
    if (!selectedFile) {
      toast.warning('Please select an XML file to upload.')
      return
    }

    setIsUploading(true)

    try {
      const { recordsIngested, recordsSkipped } = await parseAndIngestXML(selectedFile, currentUser, userProfile)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success(
        recordsSkipped > 0
          ? `Successfully ingested ${recordsIngested} patients; skipped ${recordsSkipped} invalid rows.`
          : `Successfully ingested ${recordsIngested} patients`
      )
    } catch (error) {
      console.error('Upload processing error:', error)
      if (error.recordsIngested) {
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      toast.error(`Failed to parse XML: ${error.message || 'XML processing failed.'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Generate Sample XML Template for Testing
  const handleDownloadSampleTemplate = () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<yakap_batch xmlns="http://philhealth.gov.ph/yakap">
  <header>
    <facilityId>bhc-poblacion</facilityId>
    <batchDate>2024-11-12</batchDate>
    <version>2.3.4</version>
  </header>
  <patients>
    <patient>
      <caseNo>CASE-20249901</caseNo>
      <memberPin>040998811223</memberPin>
      <lastName>Dela Cruz</lastName>
      <firstName>Remedios</firstName>
      <birthdate>1975-08-20</birthdate>
      <gender>Female</gender>
      <clientType>Senior Citizen</clientType>
      <facilityId>bhc-poblacion</facilityId>
    </patient>
    <patient>
      <caseNo>CASE-20249902</caseNo>
      <memberPin>040776622334</memberPin>
      <lastName>Ramos</lastName>
      <firstName>Ernesto</firstName>
      <birthdate>1982-03-11</birthdate>
      <gender>Male</gender>
      <clientType>Regular</clientType>
      <facilityId>bhc-poblacion</facilityId>
    </patient>
  </patients>
</yakap_batch>`

    const blob = new Blob([sampleXml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_yakap_batch.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded sample_yakap_batch.xml template')
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" /> Success
          </span>
        )
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" /> Partial
          </span>
        )
      case 'Failed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        )
    }
  }

  const formatTimestamp = (timestamp) => {
    if (timestamp?.toDate) return timestamp.toDate().toLocaleString()
    if (timestamp instanceof Date) return timestamp.toLocaleString()
    return typeof timestamp === 'string' ? timestamp : 'Pending'
  }

  return (
    <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <PageHeader
        title="XML Batch Ingestion"
        subtitle="Upload PhilHealth Yakap data and review batch status"
        icon={CloudUpload}
        className="!bg-transparent"
        actions={<Button
          variant="outline"
          size="sm"
          onClick={handleDownloadSampleTemplate}
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          Download Sample XML
        </Button>}
      />

      {/* Upload Zone Card */}
      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" />
            File Upload & Schema Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? 'cursor-pointer border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'cursor-pointer border-slate-300 bg-slate-50 hover:border-blue-500 dark:border-slate-700 dark:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".xml"
              disabled={isUploading}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20 text-blue-600 dark:text-blue-400">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop XML file here'}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to upload`
                    : 'Supported format: PhilHealth Yakap XML Specification (v2.3+). Max 25MB.'}
                </p>
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 pt-2 text-sm text-slate-600 dark:text-slate-300" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              Reading XML and saving records to Firestore...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Clear Selection
              </Button>
            )}
            <Button
              onClick={handleStartUpload}
              disabled={!selectedFile || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Processing XML...' : 'Start Upload & Ingestion'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Ingestion Logs
            </CardTitle>
            <Badge variant="outline" className="text-xs text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-700">
              Real-time Firestore
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingLogs ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-slate-900">
              <table className="w-full min-w-[800px] bg-white text-left text-xs text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">File Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Records Ingested</th>
                    <th className="px-6 py-3">Uploaded By</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="bg-white px-6 py-8 text-center text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        No ingestion logs yet.
                      </td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        <FileCode className="mr-2 inline h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" />
                        <span className="inline-block max-w-[200px] truncate align-middle">{log.fileName || log.filename || 'Unknown file'}</span>
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(log.status)}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-900 dark:text-slate-100">
                        {log.recordsIngested ?? log.records ?? 0} patient(s)
                        {(log.recordsSkipped > 0 || log.recordsFailed > 0) &&
                          ` · ${log.recordsSkipped || 0} skipped / ${log.recordsFailed || 0} failed`}
                      </td>
                      <td className="px-6 py-3.5 text-slate-900 dark:text-slate-100">{log.uploadedBy || 'Unknown user'}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-900 dark:text-slate-100">{formatTimestamp(log.timestamp || log.date)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log)
                            setLogDialogOpen(true)
                          }}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Log
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FileText className="w-5 h-5 text-blue-400" />
              Ingestion Audit Trail
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs">
              Transaction details for {selectedLog?.fileName || selectedLog?.filename}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">File Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{selectedLog.fileName || selectedLog.filename || 'Unknown file'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Execution Status</span>
                {getStatusBadge(selectedLog.status)}
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Records Ingested</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">{selectedLog.recordsIngested ?? selectedLog.records ?? 0} records</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Skipped / Failed</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">
                  {selectedLog.recordsSkipped || 0} skipped / {selectedLog.recordsFailed || 0} failed
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Initiated By</span>
                <span className="text-slate-900 dark:text-slate-200">{selectedLog.uploadedBy}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Ingestion Timestamp</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatTimestamp(selectedLog.timestamp || selectedLog.date)}</span>
              </div>
              {selectedLog.facilityId && (
                <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Facility ID</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200">{selectedLog.facilityId}</span>
                </div>
              )}
              {selectedLog.batchDate && (
                <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Batch Date</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200">{selectedLog.batchDate}</span>
                </div>
              )}
              {selectedLog.version && (
                <div className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">XML Version</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200">{selectedLog.version}</span>
                </div>
              )}
              {selectedLog.error && (
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                  <span className="font-semibold block mb-1">Parser Exception:</span>
                  {selectedLog.error}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setLogDialogOpen(false)}
              className="bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
