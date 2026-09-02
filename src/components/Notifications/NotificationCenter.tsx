import { useNotificationStore } from '../../store/notificationStore'
import { useState, useEffect } from 'react'
import styles from './NotificationCenter.module.css'

/**
 * Top-level notification toasts. Rendered independently of the status bar so
 * error, warning, and info messages stay visible even when the status bar is
 * hidden. Notifications can expose an inline action (e.g. "Reload file").
 */
export function NotificationCenter() {
  const notifications = useNotificationStore(state => state.notifications)
  const removeNotification = useNotificationStore(state => state.removeNotification)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Auto-dismiss already-hidden notifications from the store list
  useEffect(() => {
    if (dismissed.size > 0) {
      const ids = new Set(notifications.map(n => n.id))
      for (const id of dismissed) {
        if (!ids.has(id)) setDismissed(prev => { const next = new Set(prev); next.delete(id); return next })
      }
    }
  }, [notifications, dismissed])

  if (notifications.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
    removeNotification(id)
  }

  const visible = notifications.slice(0, 4)

  return (
    <div className={styles.toastStack} aria-live="polite">
      {visible.map(n => (
        <div key={n.id} className={`${styles.toast} ${styles[`toast_${n.type}`] || ''}`}>
          <div className={styles.toastBody}>
            <div className={styles.toastHeader}>
              <span className={styles.toastTitle}>{n.message}</span>
              <button
                className={styles.dismiss}
                onClick={() => handleDismiss(n.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
            {n.details && <p className={styles.toastDetails}>{n.details}</p>}
            <div className={styles.toastActions}>
              {n.action && (
                <button
                  className={styles.actionBtn}
                  onClick={() => {
                    n.action?.handler()
                    handleDismiss(n.id)
                  }}
                >
                  {n.action.label}
                </button>
              )}
              <span className={styles.time}>
                {new Date(n.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}