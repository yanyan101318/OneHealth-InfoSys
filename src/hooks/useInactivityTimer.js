import { useEffect } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll']

export default function useInactivityTimer({
  enabled,
  isLocked,
  setIsLocked,
  timeout = 300000,
}) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('isSessionLocked') === 'true') {
        setIsLocked(true)
      }
    } catch (error) {
      console.warn('Unable to restore session lock state:', error)
    }

    if (!enabled) return undefined

    let timerId
    const resetTimer = () => {
      if (isLocked) return
      window.clearTimeout(timerId)
      timerId = window.setTimeout(() => setIsLocked(true), timeout)
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true })
    })
    resetTimer()

    return () => {
      window.clearTimeout(timerId)
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer)
      })
    }
  }, [enabled, isLocked, setIsLocked, timeout])
}
