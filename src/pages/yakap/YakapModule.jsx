import { Routes, Route, Navigate } from 'react-router-dom'
import RegisteredYakap from './RegisteredYakap'
import PhilhealthMasterList from './PhilhealthMasterList'
import MemberCheck from './MemberCheck'
import UploadPage from './UploadPage'
import ReportsPage from './ReportsPage'

export default function YakapModule() {
  return (
    <div className="max-w-7xl">
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
