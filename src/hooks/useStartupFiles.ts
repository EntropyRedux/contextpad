import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'

/**
 * Hook to handle files passed via CLI arguments or "Open With" context menu
 */
export function useStartupFiles() {
  const addTab = useTabStore(state => state.addTab)
  const tabs = useTabStore(state => state.tabs)
  const setActiveTab = useTabStore(state => state.setActiveTab)
  const addRecentFile = useTabStore(state => state.addRecentFile)

  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async () => {
      // Listen for files opened via CLI or deep link
      unlisten = await listen<string[]>('open-files', async (event) => {
        const filePaths = event.payload

        for (const filePath of filePaths) {
          try {
            // Check if already open
            const existingTab = tabs.find(t => t.filePath === filePath)
            if (existingTab) {
              setActiveTab(existingTab.id)
              continue
            }

            // Read and open file
            const content = await invoke<string>('read_file', { path: filePath })
            const fileName = await invoke<string>('get_file_name', { path: filePath })
            const language = await invoke<string>('detect_language_from_path', { path: filePath })

            addTab({
              title: fileName,
              content,
              filePath,
              language,
              isDirty: false
            })

            addRecentFile(filePath)
          } catch (error) {
            console.error(`Failed to open startup file: ${filePath}`, error)
          }
        }
      })
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [tabs, addTab, setActiveTab, addRecentFile])
}
