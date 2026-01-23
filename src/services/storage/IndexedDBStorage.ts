/**
 * IndexedDB Storage Service
 * Handles large content storage to avoid localStorage quota issues
 */

const DB_NAME = 'contextpad-storage'
const DB_VERSION = 1
const CONTENT_STORE = 'tab-contents'
const METADATA_STORE = 'tab-metadata'

export interface TabContent {
  tabId: string
  content: string
  lastModified: number
}

export interface TabMetadata {
  tabId: string
  title: string
  filePath: string | null
  language: string
  isDirty: boolean
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private isSupported: boolean = true

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage')
      this.isSupported = false
      return
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          console.error('Failed to open IndexedDB:', request.error)
          this.isSupported = false
          resolve() // Don't reject, just mark as unsupported
        }

        request.onsuccess = () => {
          this.db = request.result

          // Handle database close events
          this.db.onclose = () => {
            this.db = null
            this.initPromise = null
          }

          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Store for tab content (large data)
          if (!db.objectStoreNames.contains(CONTENT_STORE)) {
            db.createObjectStore(CONTENT_STORE, { keyPath: 'tabId' })
          }

          // Store for tab metadata (small data, for quick loading)
          if (!db.objectStoreNames.contains(METADATA_STORE)) {
            const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'tabId' })
            metadataStore.createIndex('filePath', 'filePath', { unique: false })
          }
        }
      } catch (error) {
        console.error('IndexedDB initialization error:', error)
        this.isSupported = false
        resolve()
      }
    })

    return this.initPromise
  }

  /**
   * Check if IndexedDB is available and working
   */
  isAvailable(): boolean {
    return this.isSupported && this.db !== null
  }

  /**
   * Save tab content to IndexedDB
   */
  async saveTabContent(tabId: string, content: string): Promise<boolean> {
    await this.init()
    if (!this.isAvailable()) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([CONTENT_STORE], 'readwrite')
        const store = transaction.objectStore(CONTENT_STORE)

        const data: TabContent = {
          tabId,
          content,
          lastModified: Date.now()
        }

        const request = store.put(data)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error('Failed to save tab content:', request.error)
          resolve(false)
        }
      } catch (error) {
        console.error('Error saving tab content:', error)
        resolve(false)
      }
    })
  }

  /**
   * Get tab content from IndexedDB
   */
  async getTabContent(tabId: string): Promise<string | null> {
    await this.init()
    if (!this.isAvailable()) return null

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([CONTENT_STORE], 'readonly')
        const store = transaction.objectStore(CONTENT_STORE)

        const request = store.get(tabId)

        request.onsuccess = () => {
          const result = request.result as TabContent | undefined
          resolve(result?.content ?? null)
        }
        request.onerror = () => {
          console.error('Failed to get tab content:', request.error)
          resolve(null)
        }
      } catch (error) {
        console.error('Error getting tab content:', error)
        resolve(null)
      }
    })
  }

  /**
   * Delete tab content from IndexedDB
   */
  async deleteTabContent(tabId: string): Promise<boolean> {
    await this.init()
    if (!this.isAvailable()) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([CONTENT_STORE], 'readwrite')
        const store = transaction.objectStore(CONTENT_STORE)

        const request = store.delete(tabId)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error('Failed to delete tab content:', request.error)
          resolve(false)
        }
      } catch (error) {
        console.error('Error deleting tab content:', error)
        resolve(false)
      }
    })
  }

  /**
   * Save tab metadata to IndexedDB
   */
  async saveTabMetadata(metadata: TabMetadata): Promise<boolean> {
    await this.init()
    if (!this.isAvailable()) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([METADATA_STORE], 'readwrite')
        const store = transaction.objectStore(METADATA_STORE)

        const request = store.put(metadata)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error('Failed to save tab metadata:', request.error)
          resolve(false)
        }
      } catch (error) {
        console.error('Error saving tab metadata:', error)
        resolve(false)
      }
    })
  }

  /**
   * Get all tab metadata from IndexedDB
   */
  async getAllTabMetadata(): Promise<TabMetadata[]> {
    await this.init()
    if (!this.isAvailable()) return []

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([METADATA_STORE], 'readonly')
        const store = transaction.objectStore(METADATA_STORE)

        const request = store.getAll()

        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => {
          console.error('Failed to get tab metadata:', request.error)
          resolve([])
        }
      } catch (error) {
        console.error('Error getting tab metadata:', error)
        resolve([])
      }
    })
  }

  /**
   * Delete tab metadata from IndexedDB
   */
  async deleteTabMetadata(tabId: string): Promise<boolean> {
    await this.init()
    if (!this.isAvailable()) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([METADATA_STORE], 'readwrite')
        const store = transaction.objectStore(METADATA_STORE)

        const request = store.delete(tabId)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error('Failed to delete tab metadata:', request.error)
          resolve(false)
        }
      } catch (error) {
        console.error('Error deleting tab metadata:', error)
        resolve(false)
      }
    })
  }

  /**
   * Delete a tab completely (content + metadata)
   */
  async deleteTab(tabId: string): Promise<boolean> {
    const contentDeleted = await this.deleteTabContent(tabId)
    const metadataDeleted = await this.deleteTabMetadata(tabId)
    return contentDeleted && metadataDeleted
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<boolean> {
    await this.init()
    if (!this.isAvailable()) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(
          [CONTENT_STORE, METADATA_STORE],
          'readwrite'
        )

        transaction.objectStore(CONTENT_STORE).clear()
        transaction.objectStore(METADATA_STORE).clear()

        transaction.oncomplete = () => resolve(true)
        transaction.onerror = () => {
          console.error('Failed to clear storage:', transaction.error)
          resolve(false)
        }
      } catch (error) {
        console.error('Error clearing storage:', error)
        resolve(false)
      }
    })
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ tabCount: number; estimatedSize: number }> {
    await this.init()
    if (!this.isAvailable()) {
      return { tabCount: 0, estimatedSize: 0 }
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([CONTENT_STORE], 'readonly')
        const store = transaction.objectStore(CONTENT_STORE)

        const request = store.getAll()

        request.onsuccess = () => {
          const contents = request.result as TabContent[]
          const tabCount = contents.length
          const estimatedSize = contents.reduce((sum, item) => {
            return sum + (item.content?.length || 0) * 2 // Approximate bytes (UTF-16)
          }, 0)

          resolve({ tabCount, estimatedSize })
        }
        request.onerror = () => {
          resolve({ tabCount: 0, estimatedSize: 0 })
        }
      } catch (error) {
        resolve({ tabCount: 0, estimatedSize: 0 })
      }
    })
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage()
