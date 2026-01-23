import { useEffect, useRef, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'
import { useNotificationStore } from '../store/notificationStore'

/**
 * Hook to watch for external file changes
 * OPTIMIZED: Only checks active tab, with longer interval and debouncing
 */
export function useFileWatcher() {
  const tabs = useTabStore(state => state.tabs)
  const activeTabId = useTabStore(state => state.activeTabId)
  const updateTab = useTabStore(state => state.updateTab)
  const addNotification = useNotificationStore(state => state.addNotification)

  // Track last checked time and modified time per tab
  const lastCheckedRef = useRef<Map<string, number>>(new Map())
  const isCheckingRef = useRef(false)

  // Get active tab
  const activeTab = tabs.find(t => t.id === activeTabId)

  // Check if file was modified externally
  const checkActiveFile = useCallback(async () => {
    if (!activeTab?.filePath || isCheckingRef.current) return

    const tabId = activeTab.id
    const filePath = activeTab.filePath

    // Don't check too frequently (minimum 5 seconds between checks for same file)
    const lastChecked = lastCheckedRef.current.get(tabId) || 0
    if (Date.now() - lastChecked < 5000) return

    isCheckingRef.current = true

    try {
      const currentModTime = await invoke<number>('get_file_modified_time', {
        path: filePath
      })

      lastCheckedRef.current.set(tabId, Date.now())

      // Store the modified time when we first load the file
      if (!activeTab.lastModifiedTime) {
        updateTab(tabId, { lastModifiedTime: currentModTime })
        return
      }

      // Check if file was modified externally
      if (currentModTime > activeTab.lastModifiedTime) {
        // Show notification instead of blocking confirm dialog
        addNotification({
          type: 'warning',
          message: `File "${activeTab.title}" changed externally`,
          details: 'The file was modified outside the editor. Click to reload.',
          duration: 10000
        })

        // Update the modified time to prevent repeated notifications
        updateTab(tabId, { lastModifiedTime: currentModTime })
      }
    } catch (error) {
      // File might have been deleted or moved - don't spam errors
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

  // Set up interval for active tab only - check every 5 seconds
  useEffect(() => {
    if (!activeTab?.filePath) return

    const interval = setInterval(checkActiveFile, 5000)

    return () => clearInterval(interval)
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
