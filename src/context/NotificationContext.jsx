import React, { createContext, useContext, useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Batch Sync Complete',
    message: 'PhilHealth e-claims synchronization completed successfully for 47 records.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    read: false,
    type: 'success',
  },
  {
    id: 'notif-2',
    title: 'PhilHealth Konsulta Circular',
    message: 'Updated primary care screening parameters published by PhilHealth Central Office.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    type: 'info',
  },
  {
    id: 'notif-3',
    title: 'Pending Records Notice',
    message: '1 draft patient record is pending final clinical encoding in your facility.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: false,
    type: 'warning',
  },
]

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('user_notifications')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS
  })

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('user_notifications', JSON.stringify(notifications))
    } catch {
      // ignore
    }
  }, [notifications])

  // Listen for real-time notifications in Firestore if collection exists
  useEffect(() => {
    if (!currentUser?.uid) return

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [currentUser.uid, 'all'])
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
            setNotifications((prev) => {
              // Merge Firestore notifications with local ones
              const merged = [...list]
              prev.forEach((p) => {
                if (!merged.some((m) => m.id === p.id)) {
                  merged.push(p)
                }
              })
              return merged.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )
            })
          }
        },
        (err) => {
          console.warn('Firestore notifications listener note:', err)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.warn('Notification listener setup note:', err)
    }
  }, [currentUser])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Mark all notifications as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    // If Firestore notifications exist, update them as well
    if (currentUser?.uid) {
      try {
        const batch = writeBatch(db)
        notifications
          .filter((n) => !n.read && n.id.length > 15) // firestore IDs
          .forEach((n) => {
            const ref = doc(db, 'notifications', n.id)
            batch.update(ref, { read: true })
          })
        await batch.commit().catch(() => {})
      } catch {
        // ignore
      }
    }
  }

  // Mark a single notification as read
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  // Add a new notification
  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info',
      ...notif,
    }
    setNotifications((prev) => [newNotif, ...prev])
  }

  // Clear all
  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        addNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
