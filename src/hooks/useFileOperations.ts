import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'
import { useNotificationStore } from '../store/notificationStore'

export function useFileOperations() {
  const { addTab, updateTab, getActiveTab, addRecentFile, setOpenFolderPath, toggleLeftSidebar, showLeftSidebar } = useTabStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const openFile = async () => {
    try {
      const filePath = await invoke<string | null>('open_file_dialog')

      if (!filePath) return // User cancelled

      let content = await invoke<string>('read_file', { path: filePath })
      const fileName = await invoke<string>('get_file_name', { path: filePath })
      const language = await invoke<string>('detect_language_from_path', { path: filePath })
      // Extract folder path from file path
      const pathParts = filePath.split(/[\\/]/)
      pathParts.pop() // Remove filename
      const folderPath = pathParts.join('\\')

      addTab({
        title: fileName,
        content,
        filePath,
        folderPath,
        isDirty: false,
      })

      // Add to recent files
      addRecentFile(filePath)

      // Success notification
      addNotification({
        type: 'success',
        message: 'File opened',
        details: `Successfully opened: ${fileName}`
      })
    } catch (error) {
      console.error('Failed to open file:', error)
      addNotification({
        type: 'error',
        message: 'Failed to open file',
        details: String(error)
      })
    }
  }

  const saveFile = async (tabId?: string) => {
    try {
      const tab = tabId ? useTabStore.getState().tabs.find(t => t.id === tabId) : getActiveTab()

      if (!tab) return

      let filePath = tab.filePath

      // If no file path, show save dialog
      if (!filePath) {
        const defaultName = tab.title.endsWith('.md') ? tab.title : `${tab.title}.md`
        filePath = await invoke<string | null>('save_file_dialog', { defaultName })

        if (!filePath) return // User cancelled
      }

      await invoke('write_file', { path: filePath, content: tab.content })

      const fileName = await invoke<string>('get_file_name', { path: filePath })
      const language = await invoke<string>('detect_language_from_path', { path: filePath })

      updateTab(tab.id, {
        title: fileName,
        filePath,
        language,
        isDirty: false,
      })

      // Add to recent files
      addRecentFile(filePath)

      // Success notification
      addNotification({
        type: 'success',
        message: 'File saved',
        details: `Saved: ${fileName}`
      })

      return true
    } catch (error) {
      console.error('Failed to save file:', error)
      addNotification({
        type: 'error',
        message: 'Failed to save file',
        details: String(error)
      })
      return false
    }
  }

  const saveFileAs = async (tabId?: string) => {
    try {
      const tab = tabId ? useTabStore.getState().tabs.find(t => t.id === tabId) : getActiveTab()

      if (!tab) return

      const defaultName = tab.title.endsWith('.md') ? tab.title : `${tab.title}.md`
      const filePath = await invoke<string | null>('save_file_dialog', { defaultName })

      if (!filePath) return // User cancelled

      await invoke('write_file', { path: filePath, content: tab.content })

      const fileName = await invoke<string>('get_file_name', { path: filePath })
      const language = await invoke<string>('detect_language_from_path', { path: filePath })

      updateTab(tab.id, {
        title: fileName,
        filePath,
        language,
        isDirty: false,
      })

      // Add to recent files
      addRecentFile(filePath)

      return true
    } catch (error) {
      console.error('Failed to save file:', error)
      addNotification({
        type: 'error',
        message: 'Failed to save file',
        details: String(error)
      })
      return false
    }
  }

  const newFile = () => {
    const existingUntitled = useTabStore.getState().tabs.filter(t =>
      t.title.startsWith('Untitled')
    )
    const newNumber = existingUntitled.length + 1

    addTab({
      title: `Untitled-${newNumber}`,
      content: '',
      language: 'markdown',
    })
  }

  const openRecentFile = async (filePath: string) => {
    try {
      let content = await invoke<string>('read_file', { path: filePath })
      const fileName = await invoke<string>('get_file_name', { path: filePath })
      const language = await invoke<string>('detect_language_from_path', { path: filePath })

      addTab({
        title: fileName,
        content,
        filePath,
        language,
        isDirty: false,
      })

      // Move to top of recent files
      addRecentFile(filePath)
    } catch (error) {
      console.error('Failed to open recent file:', error)
      addNotification({
        type: 'error',
        message: 'Failed to open recent file',
        details: String(error)
      })
    }
  }

  const openFolder = async () => {
    try {
      const folderPath = await invoke<string | null>('open_folder_dialog')
      if (folderPath) {
        // Set global folder path (workspace root)
        setOpenFolderPath(folderPath)
        
        // Also set on active tab for context
        const activeTab = getActiveTab()
        if (activeTab) {
          updateTab(activeTab.id, { folderPath })
        }

        addNotification({
          type: 'success',
          message: 'Workspace Opened',
          details: `Workspace set to: ${folderPath}`
        })
      }
    } catch (error) {
      console.error('Failed to open workspace:', error)
      addNotification({
        type: 'error',
        message: 'Failed to open workspace',
        details: String(error)
      })
    }
  }

  return {
    openFile,
    saveFile,
    saveFileAs,
    newFile,
    openRecentFile,
    openFolder,
  }
}
