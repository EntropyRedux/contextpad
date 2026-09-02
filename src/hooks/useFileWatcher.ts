import { useEffect, useRef, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'
import { useNotificationStore } from '../store/notificationStore'

/**
 * Hook to watch for external file changes.
 *
 * OPTIMIZED: Uses window focus events instead of polling.
 * Only checks the active tab when the user switches back to the app,
 * which eliminates continuous background IPC calls entirely.
 *
 * The "changed externally" notification now carries an actionable Reload
 * button instead of a dead "click to reload" hint.
 */
export function useFileWatcher() {
  const tabs = useTabStore(state => state.tabs)
  const activeTabId = useTabStore(state => state.activeTabId)
  const updateTab = useTabStore(state => state.updateTab)
  const addNotification = useNotificationStore(state => state.addNotification)

  const isCheckingRef = useRef(false)
  const lastCheckedRef = useRef<Map<string, number>>(new Map())
  const pendingReloadRef = useRef<Map<string, number>>(new Map())

  const activeTab = tabs.find(t => t.id === activeTabId)

  const checkActiveFile = useCallback(async () => {
    if (!activeTab?.filePath || isCheckingRef.current) return

    const tabId = activeTab.id
    const filePath = activeTab.filePath

    // Minimum 2 seconds between checks for the same file
    const lastChecked = lastCheckedRef.current.get(tabId) || 0
    if (Date.now() - lastChecked < 2000) return

    isCheckingRef.current = true

    try {
      const currentModTime = await invoke<number>('get_file_modified_time', {
        path: filePath
      })

      lastCheckedRef.current.set(tabId, Date.now())

      if (!activeTab.lastModifiedTime) {
        updateTab(tabId, { lastModifiedTime: currentModTime })
        return
      }

      if (currentModTime > activeTab.lastModifiedTime) {
        // Only surface one notification per detected change; do not consume
        // the modification time until the user actually reloads (or saves).
        const lastNotified = pendingReloadRef.current.get(tabId)
        if (lastNotified === currentModTime) return
        pendingReloadRef.current.set(tabId, currentModTime)

        addNotification({
          type: 'warning',
          message: `File "${activeTab.title}" changed externally`,
          details: 'The file was modified outside the editor.',
          duration: 12000,
          action: {
            label: 'Reload',
            handler: async () => {
              try {
                const content = await invoke<string>('read_file', { path: filePath })
                updateTab(tabId, {
                  content,
                  lastModifiedTime: currentModTime,
                  isDirty: false
                })
                pendingReloadRef.current.delete(tabId)
                addNotification({
                  type: 'success',
                  message: `Reloaded "${activeTab.title}" from disk`
                })
              } catch (reloadError) {
                console.error(`Failed to reload ${filePath}:`, reloadError)
                addNotification({
                  type: 'error',
                  message: 'Failed to reload file',
                  details: String(reloadError)
                })
              }
            }
          }
        })
      }
    } catch (error) {
      console.warn(`Error checking file ${filePath}:`, error)
    } finally {
      isCheckingRef.current = false
    }
  }, [activeTab, updateTab, addNotification])

  // Check on tab switch
  useEffect(() => {
    if (activeTab?.filePath) {
      checkActiveFile()
    }
  }, [activeTabId, checkActiveFile])

  // Check when window regains focus (replaces 5-second polling)
  useEffect(() => {
    if (!activeTab?.filePath) return

    const handleFocus = () => {
      checkActiveFile()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [activeTabId, checkActiveFile])

  // Clean up refs when tabs are removed
  useEffect(() => {
    const currentTabIds = new Set(tabs.map(t => t.id))

    for (const tabId of lastCheckedRef.current.keys()) {
      if (!currentTabIds.has(tabId)) {
        lastCheckedRef.current.delete(tabId)
      }
    }
  }, [tabs])
}
