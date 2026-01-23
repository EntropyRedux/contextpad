import { useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'

export function GlobalErrorHandler() {
  const addNotification = useNotificationStore(state => state.addNotification)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Prevent default browser console error if handled here? 
      // Usually better to let it log to console too.
      addNotification({
        type: 'error',
        message: 'Application Error',
        details: event.message || 'An unexpected error occurred',
        duration: 8000
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      let details = 'Unknown error'
      if (event.reason instanceof Error) {
        details = event.reason.message
      } else if (typeof event.reason === 'string') {
        details = event.reason
      } else {
        details = JSON.stringify(event.reason)
      }

      addNotification({
        type: 'error',
        message: 'Async Operation Failed',
        details: `Unhandled Promise Rejection: ${details}`,
        duration: 8000
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [addNotification])

  return null
}
