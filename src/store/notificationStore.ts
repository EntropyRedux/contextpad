import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  details?: string
  timestamp: number
  autoHide?: boolean
  duration?: number // milliseconds
}

interface NotificationState {
  notifications: Notification[]
  currentNotification: Notification | null

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setCurrentNotification: (notification: Notification | null) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  currentNotification: null,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      autoHide: notification.autoHide ?? true,
      duration: notification.duration ?? (notification.type === 'error' ? 5000 : 3000)
    }

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      currentNotification: newNotification
    }))

    // Auto-hide if enabled
    if (newNotification.autoHide) {
      setTimeout(() => {
        set((state) => ({
          currentNotification: state.currentNotification?.id === newNotification.id
            ? null
            : state.currentNotification
        }))
      }, newNotification.duration)
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
      currentNotification: state.currentNotification?.id === id ? null : state.currentNotification
    }))
  },

  clearNotifications: () => {
    set({ notifications: [], currentNotification: null })
  },

  setCurrentNotification: (notification) => {
    set({ currentNotification: notification })
  }
}))
