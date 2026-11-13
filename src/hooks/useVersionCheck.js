/**
 * useVersionCheck
 * Returns whether the "What's New" modal should be shown.
 * Checks against localStorage key: 'lastSeenVersion'
 */

export const CURRENT_APP_VERSION = 'v2.3.4'
export const APP_VERSION = CURRENT_APP_VERSION
const STORAGE_KEY = 'lastSeenVersion'

export function getStoredVersion() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function markVersionSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION)
  } catch {
    // ignore storage errors
  }
}

export function shouldShowWhatsNew() {
  const stored = getStoredVersion()
  return stored !== CURRENT_APP_VERSION
}
