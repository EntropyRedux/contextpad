/**
 * Standardized error handling utilities
 */

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return JSON.stringify(error)
}

/**
 * Standard error notification type
 */
export interface ErrorNotification {
  type: 'error' | 'warning'
  message: string
  details?: string
  duration?: number
}

/**
 * Create a standard error notification object
 */
export function createErrorNotification(
  context: string,
  error: unknown,
  type: 'error' | 'warning' = 'error'
): ErrorNotification {
  const message = getErrorMessage(error)

  return {
    type,
    message: `${context}`,
    details: message,
    duration: type === 'error' ? 5000 : 4000
  }
}

/**
 * Log error with context and return notification object
 */
export function handleError(
  error: unknown,
  context: string,
  logToConsole: boolean = true
): ErrorNotification {
  if (logToConsole) {
    console.error(`[${context}]`, error)
  }

  return createErrorNotification(context, error)
}

/**
 * Safe async wrapper that catches errors and returns null
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[${context}]`, error)
    return null
  }
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  context: string,
  onError?: (error: unknown) => void
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>) => {
    try {
      return fn(...args)
    } catch (error) {
      console.error(`[${context}]`, error)
      onError?.(error)
      return undefined
    }
  }
}
