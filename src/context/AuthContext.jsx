import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export const CURRENT_VERSION = 'v2.3.4'
const VERSION_STORAGE_KEY = 'lastSeenVersion'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  // Keep the app in its loading state until Firebase restores the persisted user
  // and the corresponding profile has been loaded.
  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          if (!user) {
            setCurrentUser(null)
            setUserProfile(null)
            setRequiresPasswordChange(false)
            setIsLocked(false)
            return
          }

          setCurrentUser(user)
          const userDocRef = doc(db, 'users', user.uid)
          const snap = await getDoc(userDocRef)
          if (!active || auth.currentUser?.uid !== user.uid) return

          if (snap.exists()) {
            const profileData = snap.data()
            setUserProfile(profileData)
            setRequiresPasswordChange(profileData.requiresPasswordChange === true)
          } else {
            const defaultProfile = {
              name: user.displayName || user.email?.split('@')[0] || 'Maria Santos',
              role: user.email?.toLowerCase().includes('admin') ? 'Admin' : 'Health Worker',
              facility: 'Barangay Health Center - Poblacion',
              facilityId: 'bhc-poblacion',
              email: user.email,
              lastSeenVersion: null,
            }
            await setDoc(userDocRef, defaultProfile, { merge: true })
            setUserProfile(defaultProfile)
          }
        } catch (err) {
          if (!active) return
          console.warn('Error fetching user profile from Firestore:', err)
          // Fallback in-memory profile if Firestore permissions or offline
          if (user && auth.currentUser?.uid === user.uid) {
            setUserProfile({
              name: user.displayName || user.email?.split('@')[0] || 'Maria Santos',
              role: user.email?.toLowerCase().includes('admin') ? 'Admin' : 'Health Worker',
              facility: 'Barangay Health Center - Poblacion',
              facilityId: 'bhc-poblacion',
              email: user.email,
            })
            setRequiresPasswordChange(false)
          }
        } finally {
          if (active) setLoading(false)
        }
      },
      (error) => {
        console.error('Firebase authentication state listener failed:', error)
        if (active) {
          setCurrentUser(null)
          setUserProfile(null)
          setRequiresPasswordChange(false)
          setIsLocked(false)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  // Login function with Firebase Auth
  // Creates users/{uid} doc if it doesn't exist
  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const user = cred.user
      const userDocRef = doc(db, 'users', user.uid)
      const snap = await getDoc(userDocRef)
      let profileData = null
      if (snap.exists()) {
        profileData = snap.data()
        setRequiresPasswordChange(profileData.requiresPasswordChange === true)
      } else {
        profileData = {
          name: user.displayName || email.split('@')[0] || 'Maria Santos',
          role: email.toLowerCase().includes('admin') ? 'Admin' : 'Health Worker',
          facility: 'Barangay Health Center - Poblacion',
          facilityId: 'bhc-poblacion',
          email: user.email,
          lastSeenVersion: null,
        }
        await setDoc(userDocRef, profileData, { merge: true })
      }
      setUserProfile(profileData)
      setCurrentUser(user)
      setIsLocked(false)
      return { user, profile: profileData }
    } catch (err) {
      // Handle when Email/Password provider is not yet activated in Firebase Console
      if (err.code === 'auth/configuration-not-found') {
        console.warn(
          'Firebase Auth Notice: "Email/Password" sign-in provider is not yet enabled in the Firebase Console (philhealth-acf09). Proceeding with local dev session.'
        )
        const devUser = {
          uid: email.toLowerCase().includes('admin') ? 'dev-user-admin' : 'dev-user-msantos',
          email,
          displayName: email.split('@')[0] || (email.toLowerCase().includes('admin') ? 'System Admin' : 'Maria Santos'),
          isAnonymous: false,
        }
        const profileData = {
          name: email.split('@')[0] || (email.toLowerCase().includes('admin') ? 'System Admin' : 'Maria Santos'),
          role: email.toLowerCase().includes('admin') ? 'Admin' : 'Health Worker',
          facility: 'Barangay Health Center - Poblacion',
          facilityId: 'bhc-poblacion',
          email,
          lastSeenVersion: null,
        }
        try {
          await setDoc(doc(db, 'users', devUser.uid), profileData, { merge: true })
        } catch (fsErr) {
          console.warn('Firestore user doc sync note:', fsErr)
        }
        setCurrentUser(devUser)
        setUserProfile(profileData)
        setIsLocked(false)
        return { user: devUser, profile: profileData, isDevSession: true }
      }

      // If user not found, support seamless auto-registration for the demo credentials
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password)
          const user = cred.user
          const profileData = {
            name: email.split('@')[0] || (email.toLowerCase().includes('admin') ? 'System Admin' : 'Maria Santos'),
            role: email.toLowerCase().includes('admin') ? 'Admin' : 'Health Worker',
            facility: 'Barangay Health Center - Poblacion',
            facilityId: 'bhc-poblacion',
            email: user.email,
            lastSeenVersion: null,
          }
          await setDoc(doc(db, 'users', user.uid), profileData, { merge: true })
          setUserProfile(profileData)
          setCurrentUser(user)
          setIsLocked(false)
          return { user, profile: profileData }
        } catch (createErr) {
          if (createErr.code === 'auth/configuration-not-found') {
            const devUser = {
              uid: email.toLowerCase().includes('admin') ? 'dev-user-admin' : 'dev-user-msantos',
              email,
              displayName: email.split('@')[0] || (email.toLowerCase().includes('admin') ? 'System Admin' : 'Maria Santos'),
            }
            const profileData = {
              name: email.split('@')[0] || (email.toLowerCase().includes('admin') ? 'System Admin' : 'Maria Santos'),
              role: email.toLowerCase().includes('admin') ? 'Admin' : 'Health Worker',
              facility: 'Barangay Health Center - Poblacion',
              facilityId: 'bhc-poblacion',
              email,
              lastSeenVersion: null,
            }
            setCurrentUser(devUser)
            setUserProfile(profileData)
            setIsLocked(false)
            return { user: devUser, profile: profileData, isDevSession: true }
          }
          throw err // throw original error if creation also fails
        }
      }
      throw err
    }
  }

  // Logout function
  const logout = async () => {
    setShowWhatsNew(false)
    setRequiresPasswordChange(false)
    setIsLocked(false)
    try {
      await signOut(auth)
    } catch {
      // ignore
    }
    setCurrentUser(null)
    setUserProfile(null)
  }

  const unlockWithPassword = async (password) => {
    if (!currentUser || typeof currentUser.getIdToken !== 'function' || !currentUser.email) {
      throw new Error('Password verification is unavailable for this session. Please sign out and sign in again.')
    }
    const credential = EmailAuthProvider.credential(currentUser.email, password)
    await reauthenticateWithCredential(currentUser, credential)
    setIsLocked(false)
  }

  // Clear the requiresPasswordChange flag after user successfully resets password
  const clearPasswordChangeFlag = async () => {
    try {
      if (currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), { requiresPasswordChange: false }).catch(() => {})
      }
    } catch {}
    setRequiresPasswordChange(false)
    if (userProfile) {
      setUserProfile({ ...userProfile, requiresPasswordChange: false })
    }
  }

  // Dismiss What's New modal and persist version
  const dismissWhatsNew = async () => {
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION)
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userRef, { lastSeenVersion: CURRENT_VERSION }).catch(() => {})
      }
    } catch (err) {
      console.error('Failed to save lastSeenVersion:', err)
    }
    setShowWhatsNew(false)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        userProfile,
        loading,
        login,
        logout,
        showWhatsNew,
        setShowWhatsNew,
        dismissWhatsNew,
        CURRENT_VERSION,
        requiresPasswordChange,
        clearPasswordChangeFlag,
        isLocked,
        setIsLocked,
        unlockWithPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
