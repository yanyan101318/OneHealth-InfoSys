import { where } from 'firebase/firestore'

const ADMIN_ROLES = new Set(['admin', 'administrator'])

export function isAdminUser(userProfile) {
  return ADMIN_ROLES.has(String(userProfile?.role || '').toLowerCase())
}

export function getFacilityFilter(userProfile, selectedFacility) {
  if (isAdminUser(userProfile)) {
    return selectedFacility && !['All', 'all'].includes(selectedFacility)
      ? where('facilityId', '==', selectedFacility)
      : null
  }

  return where('facilityId', '==', userProfile?.facilityId || '__unassigned__')
}
