import { useMemo } from 'react'
import { query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { isAdminUser } from '../lib/facilityAccess'

export function useFacilityFilter(collectionRef, selectedFacility) {
  const { currentUser, userProfile } = useAuth()

  return useMemo(() => {
    if (!currentUser?.uid || !collectionRef) return null

    if (isAdminUser(userProfile)) {
      if (selectedFacility && !['all', 'All'].includes(selectedFacility)) {
        return query(collectionRef, where('facilityId', '==', selectedFacility))
      }
      return collectionRef
    }

    return query(
      collectionRef,
      where('facilityId', '==', userProfile?.facilityId || '__unassigned__')
    )
  }, [
    collectionRef,
    currentUser?.uid,
    selectedFacility,
    userProfile,
  ])
}
