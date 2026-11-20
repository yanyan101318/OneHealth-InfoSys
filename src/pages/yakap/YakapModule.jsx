import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const RegisteredYakap = lazy(() => import('./RegisteredYakap'))
const PhilhealthMasterList = lazy(() => import('./PhilhealthMasterList'))
const MemberCheck = lazy(() => import('./MemberCheck'))
const UploadPage = lazy(() => import('./UploadPage'))
const ReportsPage = lazy(() => import('./ReportsPage'))

export default function YakapModule() {
  return (
    <div className="w-full max-w-none">
      <div>
        <Routes>
          {/* /yakap automatically redirects to /yakap/registered */}
          <Route index element={<Navigate to="registered" replace />} />
          <Route path="registered" element={<RegisteredYakap />} />
          <Route path="philhealth" element={<PhilhealthMasterList />} />
          <Route path="member-check" element={<MemberCheck />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="reports" element={<ReportsPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="registered" replace />} />
        </Routes>
      </div>
    </div>
  )
}
