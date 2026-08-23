/**
 * Unified Debounce Utility with maxWait and cancellation support
 */

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

export interface DebounceOptions {
  wait?: number
  maxWait?: number
  immediate?: boolean
}

export function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  waitOrOptions: number | DebounceOptions = 300
): DebouncedFunction<T> {
  const options: DebounceOptions =
    typeof waitOrOptions === 'number' ? { wait: waitOrOptions } : waitOrOptions

  const { wait = 300, maxWait = 0, immediate = false } = options

  let timeout: ReturnType<typeof setTimeout> | null = null
  let maxTimeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastCallTime = 0

  const invoke = () => {
    if (timeout) clearTimeout(timeout)
    if (maxTimeout) clearTimeout(maxTimeout)
    timeout = null
    maxTimeout = null

    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      lastCallTime = Date.now()
      func(...args)
    }
  }

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args
    const isFirstCall = immediate && !lastCallTime

    if (timeout) clearTimeout(timeout)

    if (maxWait > 0 && !maxTimeout) {
      maxTimeout = setTimeout(invoke, maxWait)
    }

    if (isFirstCall) {
      invoke()
    } else {
      timeout = setTimeout(invoke, wait)
    }
  }

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout)
    if (maxTimeout) clearTimeout(maxTimeout)
    timeout = null
    maxTimeout = null
    lastArgs = null
  }

  debounced.flush = () => {
    if (timeout || maxTimeout) {
      invoke()
    }
  }

  return debounced
}
