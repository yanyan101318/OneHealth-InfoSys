import { useEffect } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll']

export default function useInactivityTimer({ enabled, onInactivity, timeout = 300000 }) {
  useEffect(() => {
    if (!enabled) return undefined

    let timerId
    const resetTimer = () => {
      window.clearTimeout(timerId)
      timerId = window.setTimeout(onInactivity, timeout)
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
  }, [enabled, onInactivity, timeout])
}
