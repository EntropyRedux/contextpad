/**
 * Generic persistence utilities for localStorage
 */

export interface PersistenceOptions<T> {
  key: string
  version?: number
  migrate?: (data: unknown, fromVersion: number) => T
}

/**
 * Creates typed persistence helpers for localStorage
 */
export function createPersistence<T>(options: PersistenceOptions<T>) {
  const { key, version = 1, migrate } = options
  const versionedKey = `${key}-v${version}`

  return {
    /**
     * Load data from localStorage
     */
    load: (): T | null => {
      try {
        // Try current version first
        const saved = localStorage.getItem(versionedKey)
        if (saved) {
          return JSON.parse(saved) as T
        }

        // Try to migrate from older versions
        if (migrate) {
          for (let v = version - 1; v >= 1; v--) {
            const oldKey = v === 1 ? key : `${key}-v${v}`
            const oldData = localStorage.getItem(oldKey)
            if (oldData) {
              try {
                const migrated = migrate(JSON.parse(oldData), v)
                // Save migrated data
                localStorage.setItem(versionedKey, JSON.stringify(migrated))
                return migrated
              } catch (e) {
                console.warn(`Migration from ${oldKey} failed:`, e)
              }
            }
          }
        }

        // Try unversioned key as fallback
        const unversioned = localStorage.getItem(key)
        if (unversioned) {
          const data = JSON.parse(unversioned) as T
          // Upgrade to versioned key
          localStorage.setItem(versionedKey, unversioned)
          return data
        }
      } catch (error) {
        console.error(`Failed to load ${key}:`, error)
      }
      return null
    },

    /**
     * Save data to localStorage
     */
    save: (data: T): boolean => {
      try {
        localStorage.setItem(versionedKey, JSON.stringify(data))
        return true
      } catch (error) {
        console.error(`Failed to save ${key}:`, error)

        // Handle quota exceeded
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded')
        }
        return false
      }
    },

    /**
     * Clear stored data
     */
    clear: (): void => {
      try {
        localStorage.removeItem(versionedKey)
        localStorage.removeItem(key) // Also clear unversioned
      } catch (error) {
        console.error(`Failed to clear ${key}:`, error)
      }
    },

    /**
     * Get the storage key being used
     */
    getKey: (): string => versionedKey
  }
}

/**
 * Get an estimate of localStorage usage
 */
export function getLocalStorageUsage(): { used: number; available: number } {
  let used = 0
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage[key].length * 2 // UTF-16 chars = 2 bytes each
      }
    }
  } catch (e) {
    console.warn('Could not calculate localStorage usage:', e)
  }

  // Most browsers have ~5-10MB limit
  const available = 5 * 1024 * 1024 // Assume 5MB

  return { used, available }
}
