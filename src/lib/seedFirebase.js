import { collection, doc, writeBatch, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export const sampleFacilities = [
  { id: 'bhc-poblacion', name: 'BHC Poblacion', code: 'BHC-001', address: 'Poblacion, San Jose', active: true },
  { id: 'bhc-san-isidro', name: 'BHC San Isidro', code: 'BHC-002', address: 'San Isidro, San Jose', active: true },
  { id: 'bhc-sta-cruz', name: 'BHC Sta. Cruz', code: 'BHC-003', address: 'Sta. Cruz, San Jose', active: true },
  { id: 'bhc-bagumbayan', name: 'BHC Bagumbayan', code: 'BHC-004', address: 'Bagumbayan, San Jose', active: true },
  { id: 'rhu-main', name: 'RHU Main', code: 'RHU-001', address: 'Municipal Hall Compound, San Jose', active: true },
]

export const samplePatients = [
  {
    id: 'pat-001',
    caseNo: 'CASE-20240001',
    memberPin: '040123456789',
    patientPin: '040123456789',
    lastName: 'Santos',
    firstName: 'Maria',
    birthdate: '1985-04-12',
    gender: 'Female',
    clientType: 'Regular',
    enlistmentDate: '2024-01-15',
    facilityId: 'bhc-poblacion',
    status: 'Active',
    synced: true,
  },
  {
    id: 'pat-002',
    caseNo: 'CASE-20240002',
    memberPin: '040987654321',
    patientPin: '040987654321',
    lastName: 'Reyes',
    firstName: 'Jose',
    birthdate: '1962-08-23',
    gender: 'Male',
    clientType: 'Senior Citizen',
    enlistmentDate: '2024-02-10',
    facilityId: 'bhc-poblacion',
    status: 'Active',
    synced: true,
  },
  {
    id: 'pat-003',
    caseNo: 'CASE-20240003',
    memberPin: '040456789123',
    patientPin: '040456789123',
    lastName: 'Cruz',
    firstName: 'Ana',
    birthdate: '1995-11-05',
    gender: 'Female',
    clientType: 'Pregnant',
    enlistmentDate: '2024-03-01',
    facilityId: 'bhc-san-isidro',
    status: 'Draft',
    synced: false,
  },
  {
    id: 'pat-004',
    caseNo: 'CASE-20240004',
    memberPin: '040789123456',
    patientPin: '040789123456',
    lastName: 'Garcia',
    firstName: 'Juan',
    birthdate: '1978-06-19',
    gender: 'Male',
    clientType: 'Indigent',
    enlistmentDate: '2024-03-15',
    facilityId: 'bhc-sta-cruz',
    status: 'Active',
    synced: true,
  },
  {
    id: 'pat-005',
    caseNo: 'CASE-20240005',
    memberPin: '040321654987',
    patientPin: '040321654987',
    lastName: 'Torres',
    firstName: 'Rosa',
    birthdate: '1990-09-30',
    gender: 'Female',
    clientType: 'PWD',
    enlistmentDate: '2024-04-05',
    facilityId: 'bhc-bagumbayan',
    status: 'Active',
    synced: true,
  },
  {
    id: 'pat-006',
    caseNo: 'CASE-20240006',
    memberPin: '040654987321',
    patientPin: '040654987321',
    lastName: 'Flores',
    firstName: 'Pedro',
    birthdate: '1958-02-14',
    gender: 'Male',
    clientType: 'Senior Citizen',
    enlistmentDate: '2024-05-12',
    facilityId: 'rhu-main',
    status: 'Draft',
    synced: false,
  },
  {
    id: 'pat-007',
    caseNo: 'CASE-20240007',
    memberPin: '040112233445',
    patientPin: '040112233445',
    lastName: 'Ramos',
    firstName: 'Lourdes',
    birthdate: '1982-12-08',
    gender: 'Female',
    clientType: 'Regular',
    enlistmentDate: '2024-05-20',
    facilityId: 'bhc-poblacion',
    status: 'Active',
    synced: true,
  },
  {
    id: 'pat-008',
    caseNo: 'CASE-20240008',
    memberPin: '040998877665',
    patientPin: '040998877665',
    lastName: 'Mendoza',
    firstName: 'Antonio',
    birthdate: '1970-07-25',
    gender: 'Male',
    clientType: 'Indigent',
    enlistmentDate: '2024-06-02',
    facilityId: 'bhc-san-isidro',
    status: 'Active',
    synced: false,
  },
  {
    id: 'pat-009',
    caseNo: 'CASE-20240009',
    memberPin: '040554433221',
    patientPin: '040554433221',
    lastName: 'Villanueva',
    firstName: 'Corazon',
    birthdate: '1998-03-17',
    gender: 'Female',
    clientType: 'Pregnant',
    enlistmentDate: '2024-06-18',
    facilityId: 'bhc-sta-cruz',
    status: 'Active',
    synced: true,
  },
  {
    id: 'pat-010',
    caseNo: 'CASE-20240010',
    memberPin: '040776655443',
    patientPin: '040776655443',
    lastName: 'Dela Cruz',
    firstName: 'Ricardo',
    birthdate: '1988-10-10',
    gender: 'Male',
    clientType: 'Regular',
    enlistmentDate: '2024-07-01',
    facilityId: 'rhu-main',
    status: 'Active',
    synced: true,
  },
]

export const samplePhilhealthMembers = [
  {
    id: 'pm-001',
    registeredPin: '040123456789',
    lastName: 'Santos',
    firstName: 'Maria',
    middleName: 'G',
    sex: 'Female',
    dateOfBirth: '1985-04-12',
    clientType: 'Principal',
    registeredDate: '2024-01-10',
    effectivityYear: '2025',
    uploaded: true,
  },
  {
    id: 'pm-002',
    registeredPin: '040987654321',
    lastName: 'Reyes',
    firstName: 'Jose',
    middleName: 'P',
    sex: 'Male',
    dateOfBirth: '1962-08-23',
    clientType: 'Principal',
    registeredDate: '2024-02-05',
    effectivityYear: '2025',
    uploaded: true,
  },
  {
    id: 'pm-003',
    registeredPin: '040456789123',
    lastName: 'Cruz',
    firstName: 'Ana',
    middleName: 'M',
    sex: 'Female',
    dateOfBirth: '1995-11-05',
    clientType: 'Dependent',
    registeredDate: '2024-02-28',
    effectivityYear: '2025',
    uploaded: false,
  },
  {
    id: 'pm-004',
    registeredPin: '040789123456',
    lastName: 'Garcia',
    firstName: 'Juan',
    middleName: 'T',
    sex: 'Male',
    dateOfBirth: '1978-06-19',
    clientType: 'Principal',
    registeredDate: '2024-03-12',
    effectivityYear: '2025',
    uploaded: true,
  },
  {
    id: 'pm-005',
    registeredPin: '040321654987',
    lastName: 'Torres',
    firstName: 'Rosa',
    middleName: 'L',
    sex: 'Female',
    dateOfBirth: '1990-09-30',
    clientType: 'Dependent',
    registeredDate: '2024-04-01',
    effectivityYear: '2025',
    uploaded: false,
  },
]

export const sampleSyncLogs = [
  {
    id: 'sync-001',
    userId: 'system',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    recordsSynced: 47,
    status: 'success',
  },
  {
    id: 'sync-002',
    userId: 'system',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    recordsSynced: 32,
    status: 'success',
  },
  {
    id: 'sync-003',
    userId: 'system',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    recordsSynced: 18,
    status: 'pending',
  },
]

export async function seedFirestoreDatabase(force = false) {
  try {
    // Check if already seeded
    const existingSnap = await getDocs(collection(db, 'facilities'))
    if (!force && !existingSnap.empty) {
      console.log('Firestore already seeded. Skipping.')
      return { success: true, seeded: false }
    }

    const batch = writeBatch(db)

    // Seed Facilities
    sampleFacilities.forEach((facility) => {
      const ref = doc(db, 'facilities', facility.id)
      batch.set(ref, facility)
    })

    // Seed Patients
    samplePatients.forEach((patient) => {
      const ref = doc(db, 'patients', patient.id)
      batch.set(ref, patient)
    })

    // Seed PhilHealth Members
    samplePhilhealthMembers.forEach((member) => {
      const ref = doc(db, 'philhealth_members', member.id)
      batch.set(ref, member)
    })

    // Seed Sync Logs
    sampleSyncLogs.forEach((log) => {
      const ref = doc(db, 'sync_logs', log.id)
      batch.set(ref, log)
    })

    await batch.commit()
    console.log('Successfully seeded Firestore with sample data!')
    return { success: true, seeded: true }
  } catch (error) {
    console.error('Error seeding Firestore:', error)
    return { success: false, error: error.message }
  }
}
