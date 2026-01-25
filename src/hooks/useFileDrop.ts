import { useEffect, useRef, useCallback } from 'react'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'

// Supported file extensions for opening
const SUPPORTED_EXTENSIONS = new Set([
  'md', 'markdown', 'txt', 'text', 'log', 'ini', 'cfg', 'conf',
  'json', 'yaml', 'yml', 'xml', 'csv', 'tsv',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'pyw', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
  'rs', 'go', 'swift', 'kt', 'scala', 'lua',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
  'sql', 'graphql', 'gql',
  'env', 'gitignore', 'dockerignore', 'editorconfig'
])

// Debounce time to prevent multiple drop events
const DROP_DEBOUNCE_MS = 500

export function useFileDrop() {
  const addTab = useTabStore(state => state.addTab)
  const tabs = useTabStore(state => state.tabs)
  const setActiveTab = useTabStore(state => state.setActiveTab)
  const addRecentFile = useTabStore(state => state.addRecentFile)

  const isDraggingRef = useRef(false)
  const isProcessingRef = useRef(false)
  const lastDropTimeRef = useRef(0)

  // Store latest tabs in a ref to avoid effect re-runs
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  /**
   * Get file extension from path
   */
  const getExtension = (path: string): string => {
    const parts = path.split('.')
    if (parts.length < 2) return ''
    return parts[parts.length - 1].toLowerCase()
  }

  /**
   * Check if file is supported
   */
  const isSupported = (path: string): boolean => {
    const ext = getExtension(path)
    if (!ext) {
      const filename = path.replace(/\\/g, '/').split('/').pop()?.toLowerCase() || ''
      return ['dockerfile', 'makefile', 'jenkinsfile', 'vagrantfile'].includes(filename)
    }
    return SUPPORTED_EXTENSIONS.has(ext)
  }

  /**
   * Open a single file in a new tab (or navigate to existing)
   */
  const openFileInTab = useCallback(async (filePath: string) => {
    try {
      // Use ref to get current tabs without causing re-renders
      const currentTabs = tabsRef.current
      const existingTab = currentTabs.find(t => t.filePath === filePath)
      if (existingTab) {
        setActiveTab(existingTab.id)
        return
      }

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
      console.error(`Failed to open file: ${filePath}`, error)
    }
  }, [addTab, setActiveTab, addRecentFile])

  /**
   * Handle multiple dropped files with debounce protection
   */
  const handleDroppedFiles = useCallback(async (paths: string[]) => {
    // Debounce: ignore if we just processed a drop
    const now = Date.now()
    if (now - lastDropTimeRef.current < DROP_DEBOUNCE_MS) {
      console.log('Drop ignored (debounce)')
      return
    }
    lastDropTimeRef.current = now

    // Prevent concurrent processing
    if (isProcessingRef.current) {
      console.log('Drop ignored (already processing)')
      return
    }
    isProcessingRef.current = true

    try {
      const supportedPaths = paths.filter(isSupported)

      if (supportedPaths.length === 0) {
        console.warn('No supported files in drop')
        return
      }

      // Deduplicate paths
      const uniquePaths = [...new Set(supportedPaths)]

      for (const path of uniquePaths) {
        await openFileInTab(path)
      }
    } finally {
      isProcessingRef.current = false
    }
  }, [openFileInTab])

  // Store handler in ref so effect doesn't re-run
  const handleDroppedFilesRef = useRef(handleDroppedFiles)
  handleDroppedFilesRef.current = handleDroppedFiles

  /**
   * Set up drag-drop using Tauri webview API
   * Empty dependency array - only run once on mount
   */
  useEffect(() => {
    let unlisten: (() => void) | null = null
    let isMounted = true

    // Prevent browser's default drag behavior
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const setupListener = async () => {
      if (!isMounted) return

      try {
        const webview = getCurrentWebview()

        unlisten = await webview.onDragDropEvent((event) => {
          const payload = event.payload as {
            type: 'enter' | 'over' | 'drop' | 'leave'
            paths?: string[]
            position?: { x: number; y: number }
          }

          switch (payload.type) {
            case 'enter':
              isDraggingRef.current = true
              document.body.classList.add('file-dragging')
              break

            case 'over':
              // Position updates during drag
              break

            case 'drop':
              console.log('DROP EVENT!', payload.paths)
              isDraggingRef.current = false
              document.body.classList.remove('file-dragging')

              if (payload.paths && payload.paths.length > 0) {
                // Use ref to get latest handler
                handleDroppedFilesRef.current(payload.paths)
              }
              break

            case 'leave':
              isDraggingRef.current = false
              document.body.classList.remove('file-dragging')
              break
          }
        })
      } catch (error) {
        console.error('Failed to set up drag-drop listener:', error)
      }
    }

    // Add browser event listeners in capture phase
    window.addEventListener('dragenter', preventDefaults, { capture: true })
    window.addEventListener('dragover', preventDefaults, { capture: true })
    window.addEventListener('dragleave', preventDefaults, { capture: true })
    window.addEventListener('drop', preventDefaults, { capture: true })

    setupListener()

    return () => {
      isMounted = false
      if (unlisten) unlisten()
      window.removeEventListener('dragenter', preventDefaults, { capture: true })
      window.removeEventListener('dragover', preventDefaults, { capture: true })
      window.removeEventListener('dragleave', preventDefaults, { capture: true })
      window.removeEventListener('drop', preventDefaults, { capture: true })
      document.body.classList.remove('file-dragging')
    }
  }, []) // Empty deps - only run once

  return {
    isDragging: isDraggingRef.current
  }
}
