import React, { createContext, useContext, useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

const NotificationContext = createContext(null)

function timestampInMillis(timestamp) {
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate().getTime()
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])

  // Notifications are user-scoped Firestore records; do not retain sample or stale alerts.
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([])
      return undefined
    }

    setNotifications([])
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', 'in', [currentUser.uid, 'all'])
    )
    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        setNotifications(list.sort(
          (a, b) => timestampInMillis(b.timestamp) - timestampInMillis(a.timestamp)
        ))
      },
      (error) => {
        console.error('Firestore notifications listener failed:', error)
        setNotifications([])
        toast.error(`Unable to load system alerts: ${error.message}`)
      }
    )
  }, [currentUser])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser?.uid) return
    const unread = notifications.filter((notification) => !notification.read)
    if (!unread.length) return
    const batch = writeBatch(db)
    unread.forEach((notification) => {
      batch.update(doc(db, 'notifications', notification.id), { read: true })
    })
    try {
      await batch.commit()
    } catch (error) {
      console.error('Failed to resolve notifications:', error)
      toast.error(`Unable to resolve alerts: ${error.message}`)
    }
  }

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error(`Unable to update alert: ${error.message}`)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
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
