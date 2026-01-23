import { useEffect, useRef, RefObject, useCallback } from 'react'

/**
 * Custom hook to detect clicks outside a referenced element
 * @param callback - Function to call when clicking outside
 * @param enabled - Whether the hook is active (default: true)
 * @returns RefObject to attach to the element
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callbackRef.current()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [enabled, handleClickOutside])

  return ref
}
