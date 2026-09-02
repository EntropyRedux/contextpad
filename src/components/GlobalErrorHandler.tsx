import { useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'

// Cap ChunkLoadError auto-reload at one attempt so a stale build cannot loop.
let chunkReloadAttempted = false

/**
 * Global error handler that catches:
 * - Uncaught errors (window.error)
 * - Unhandled promise rejections (with preventDefault so the console warning
 *   is replaced by a single user-visible notification)
 */
export function GlobalErrorHandler() {
  const addNotification = useNotificationStore(state => state.addNotification)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || 'An unexpected error occurred'

      console.error('[Uncaught Error]', {
        message,
        source: `${event.filename || 'unknown'}:${event.lineno || 0}`,
        stack: event.error?.stack
      })

      addNotification({
        type: 'error',
        message: 'An Error Occurred',
        details: message,
        duration: 6000
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress the browser's default rejection log; we surface it once here.
      event.preventDefault()

      let details = 'Unknown error'
      let errorType = 'Async Operation Failed'

      if (event.reason instanceof Error) {
        details = event.reason.message

        // Categorize by error identity, not message keywords
        if (event.reason.name === 'ChunkLoadError' || /loading chunk/i.test(details)) {
          errorType = 'Module Load Error'
          if (!chunkReloadAttempted) {
            chunkReloadAttempted = true
            details = 'Failed to load application modules. Reloading...'
            setTimeout(() => window.location.reload(), 2000)
          } else {
            details = 'Failed to load application modules. Reload the app manually.'
          }
        } else if (event.reason.name === 'TypeError' && /fetch|network/i.test(details)) {
          errorType = 'Network Error'
          details = 'A network request failed.'
        }
      } else if (typeof event.reason === 'string') {
        details = event.reason
      } else if (event.reason && typeof event.reason === 'object') {
        try {
          details = JSON.stringify(event.reason)
        } catch {
          details = '[unserializable rejection]'
        }
      }

      console.error('[Unhandled Promise Rejection]', { errorType, details })

      addNotification({
        type: 'error',
        message: errorType,
        details,
        duration: 6000
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
