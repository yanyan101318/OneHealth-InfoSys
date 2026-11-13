export const mockMetrics = {
  totalIndividuals: 12847,
  registeredHouseholds: 3241,
  families: 2890,
  activeMembers: 9823,
  trends: { individuals: +12.4, households: +8.1, families: +5.3, activeMembers: +15.2 }
}
export const weeklyRegistrations = [
  { week: 'Week 1', registrations: 45, screenings: 32, consultations: 18 },
  { week: 'Week 2', registrations: 72, screenings: 55, consultations: 28 },
  { week: 'Week 3', registrations: 61, screenings: 48, consultations: 22 },
  { week: 'Week 4', registrations: 89, screenings: 67, consultations: 35 },
]
export const monthlyRegistrations = [
  { month: 'Jan', registrations: 320, target: 300 },
  { month: 'Feb', registrations: 285, target: 300 },
  { month: 'Mar', registrations: 410, target: 350 },
  { month: 'Apr', registrations: 375, target: 350 },
  { month: 'May', registrations: 490, target: 400 },
  { month: 'Jun', registrations: 445, target: 400 },
  { month: 'Jul', registrations: 520, target: 450 },
  { month: 'Aug', registrations: 480, target: 450 },
  { month: 'Sep', registrations: 610, target: 500 },
  { month: 'Oct', registrations: 575, target: 500 },
  { month: 'Nov', registrations: 490, target: 500 },
  { month: 'Dec', registrations: 380, target: 400 },
]
export const genderDistribution = [
  { name: 'Male', value: 5832, color: '#3b82f6' },
  { name: 'Female', value: 6734, color: '#ec4899' },
  { name: 'Others', value: 281, color: '#a855f7' },
]
export const activityFeed = [
  { id: 1, action: 'New member enrolled', user: 'J. Reyes', time: '2 mins ago', type: 'success' },
  { id: 2, action: 'Health screening completed', user: 'M. Cruz', time: '15 mins ago', type: 'info' },
  { id: 3, action: 'Sync completed - 47 records', user: 'System', time: '1 hr ago', type: 'success' },
  { id: 4, action: 'Failed upload attempt', user: 'A. Dela Cruz', time: '2 hrs ago', type: 'error' },
  { id: 5, action: 'Report generated: Monthly', user: 'L. Garcia', time: '3 hrs ago', type: 'info' },
  { id: 6, action: 'Password changed', user: 'R. Santos', time: '5 hrs ago', type: 'warning' },
]
export const topFacilities = [
  { rank: 1, name: 'BHC Poblacion', registrations: 523, percentage: 92 },
  { rank: 2, name: 'BHC San Isidro', registrations: 487, percentage: 85 },
  { rank: 3, name: 'BHC Sta. Cruz', registrations: 445, percentage: 78 },
  { rank: 4, name: 'BHC Bagumbayan', registrations: 398, percentage: 70 },
  { rank: 5, name: 'RHU Main', registrations: 356, percentage: 63 },
]
const firstNames = ['Maria', 'Jose', 'Ana', 'Juan', 'Rosa', 'Pedro', 'Lourdes', 'Antonio', 'Corazon', 'Ricardo']
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Torres', 'Flores', 'Ramos', 'Mendoza', 'Villanueva', 'Dela Cruz']
const facilityNames = ['BHC Poblacion', 'BHC San Isidro', 'BHC Sta. Cruz', 'BHC Bagumbayan', 'RHU Main']
const clientTypes = ['Senior Citizen', 'PWD', 'Indigent', 'Regular', 'Pregnant']
const genders = ['Male', 'Female']
export const mockYakapPatients = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  caseNo: `CASE-${String(2024001 + i).padStart(7, '0')}`,
  memberPin: `0${String(400000000 + Math.floor(Math.random() * 99999999))}`,
  patientPin: `0${String(400000000 + Math.floor(Math.random() * 99999999))}`,
  name: `${lastNames[i % 10]}, ${firstNames[i % 10]} ${firstNames[(i + 3) % 10][0]}.`,
  birthdate: `${1950 + Math.floor(Math.random() * 55)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  gender: genders[i % 2],
  clientType: clientTypes[i % 5],
  enlistmentDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  facility: facilityNames[i % 5],
  status: i % 7 === 0 ? 'Draft' : 'Active',
  synced: i % 3 !== 0,
}))
export const mockPhilhealthList = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  memberPin: `0${String(400000000 + Math.floor(Math.random() * 99999999))}`,
  name: `${lastNames[(i + 2) % 10]}, ${firstNames[(i + 1) % 10]} ${firstNames[(i + 5) % 10][0]}.`,
  birthdate: `${1960 + Math.floor(Math.random() * 45)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  gender: genders[i % 2],
  memberType: i % 3 === 0 ? 'Dependent' : 'Principal',
  validityDate: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  uploaded: i % 4 === 0,
}))
export const yakapSummary = {
  totalRegistered: 523, drafts: 47, screenings: 312, consultations: 189, synced: 476, unsynced: 47,
}
export const monthlyServicesData = [
  { month: 'Jan', screenings: 42, consultations: 28, registrations: 35 },
  { month: 'Feb', screenings: 38, consultations: 22, registrations: 30 },
  { month: 'Mar', screenings: 55, consultations: 35, registrations: 48 },
  { month: 'Apr', screenings: 61, consultations: 40, registrations: 52 },
  { month: 'May', screenings: 72, consultations: 48, registrations: 65 },
  { month: 'Jun', screenings: 68, consultations: 45, registrations: 60 },
]
export const facilitiesData = [
  { id: 'all', name: 'All Facilities' },
  { id: 'bhc-poblacion', name: 'BHC Poblacion' },
  { id: 'bhc-san-isidro', name: 'BHC San Isidro' },
  { id: 'bhc-sta-cruz', name: 'BHC Sta. Cruz' },
  { id: 'bhc-bagumbayan', name: 'BHC Bagumbayan' },
  { id: 'rhu-main', name: 'RHU Main' },
]
export const reportCategories = [
  { id: 'registration', name: 'Registration Reports', titles: [
    { id: 'monthly-reg', name: 'Monthly Registration Summary' },
    { id: 'annual-reg', name: 'Annual Registration Report' },
    { id: 'facility-reg', name: 'Per-Facility Registration' },
  ]},
  { id: 'health', name: 'Health Services', titles: [
    { id: 'screening', name: 'Health Screening Report' },
    { id: 'consultation', name: 'Consultation Summary' },
    { id: 'referral', name: 'Referral Report' },
  ]},
  { id: 'philhealth', name: 'PhilHealth Reports', titles: [
    { id: 'claims', name: 'Claims Summary Report' },
    { id: 'membership', name: 'Membership Status Report' },
    { id: 'benefits', name: 'Benefits Utilization Report' },
  ]},
]
export const uploadLogs = [
  { id: 1, filename: 'yakap_data_nov2024.xml', status: 'Success', records: 142, uploadedBy: 'M. Santos', date: '2024-11-10 14:32' },
  { id: 2, filename: 'philhealth_list_oct2024.xml', status: 'Failed', records: 0, uploadedBy: 'J. Reyes', date: '2024-11-08 09:15', error: 'Invalid XML format' },
  { id: 3, filename: 'yakap_data_oct2024.xml', status: 'Success', records: 98, uploadedBy: 'M. Santos', date: '2024-10-30 16:45' },
  { id: 4, filename: 'health_screening_oct.xml', status: 'Partial', records: 67, uploadedBy: 'A. Cruz', date: '2024-10-15 11:20', warning: '12 records skipped' },
]
export const whatsNewData = {
  version: 'v2.3.4',
  releaseDate: 'November 2024',
  features: [
    { type: 'new', text: 'Added bulk PhilHealth member upload functionality' },
    { type: 'new', text: 'Improved sync status indicator with real-time updates' },
    { type: 'improved', text: 'Enhanced DataGrid performance for large datasets' },
    { type: 'improved', text: 'Redesigned dashboard with analytics charts' },
    { type: 'fixed', text: 'Fixed member PIN validation issue on enrollment' },
    { type: 'fixed', text: 'Resolved date picker timezone offset bug' },
  ],
  previousVersions: [
    { version: 'v2.3.3', date: 'October 2024', summary: 'Performance improvements and bug fixes' },
    { version: 'v2.3.2', date: 'September 2024', summary: 'Added export to PDF functionality' },
    { version: 'v2.3.1', date: 'August 2024', summary: 'UI redesign and dark mode improvements' },
  ]
}
