import { useEffect, useRef } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'

/**
 * Hook to handle files passed via CLI arguments or "Open With" context menu
 */
export function useStartupFiles() {
  const addTab = useTabStore(state => state.addTab)
  const setActiveTab = useTabStore(state => state.setActiveTab)
  const addRecentFile = useTabStore(state => state.addRecentFile)


  const processingFilesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async () => {
      const processFiles = async (filePaths: string[]) => {
        const currentTabs = useTabStore.getState().tabs

        for (const filePath of filePaths) {
          // Prevent opening if already being processed or already open
          if (processingFilesRef.current.has(filePath)) continue

          try {
            processingFilesRef.current.add(filePath)

            // Check if already open in current state
            const existingTab = currentTabs.find(t => t.filePath === filePath)
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
          } finally {
            // Remove from processing with a small delay to handle duplicate events
            setTimeout(() => {
              processingFilesRef.current.delete(filePath)
            }, 1000)
          }
        }
      }

      // Check for pending files stored during app launch
      try {
        const pendingFiles = await invoke<string[]>('get_pending_files')
        if (pendingFiles && pendingFiles.length > 0) {
          await processFiles(pendingFiles)
        }
      } catch (err) {
        console.error("Failed to retrieve pending files:", err)
      }

      // Listen for files opened via CLI or deep link AFTER launch
      unlisten = await listen<string[]>('open-files', async (event) => {
        await processFiles(event.payload)
      })
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [addTab, setActiveTab, addRecentFile])
}
