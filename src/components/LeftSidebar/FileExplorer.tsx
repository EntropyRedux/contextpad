import { useEffect, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { VirtualizedFileTree } from './VirtualizedFileTree'
import styles from './FileExplorer.module.css'

interface FileNode {
  name: string
  path: string
  is_dir: boolean
  children?: FileNode[]
}

export function FileExplorer() {
  const openFolderPath = useTabStore(state => state.openFolderPath)
  const setOpenFolderPath = useTabStore(state => state.setOpenFolderPath)
  const addTab = useTabStore(state => state.addTab)
  const addNotification = useNotificationStore(state => state.addNotification)
  const [files, setFiles] = useState<FileNode[]>([])

  useEffect(() => {
    if (openFolderPath) {
      loadFolder(openFolderPath)
    }
  }, [openFolderPath])

  const loadFolder = async (path: string) => {
    try {
      const items = await invoke<FileNode[]>('read_directory', { path })
      setFiles(items)
    } catch (error) {
      console.error('Failed to load folder:', error)
      addNotification({
        type: 'error',
        message: 'Failed to load folder',
        details: String(error)
      })
    }
  }

  const handleOpenFolder = async () => {
    try {
      const folderPath = await invoke<string | null>('open_folder_dialog')
      if (folderPath) {
        setOpenFolderPath(folderPath)
      }
    } catch (error) {
      console.error('Failed to open folder:', error)
      addNotification({
        type: 'error',
        message: 'Failed to open folder',
        details: String(error)
      })
    }
  }

  const handleCloseFolder = () => {
    setOpenFolderPath(null)
    setFiles([])
  }

  const handleFileClick = useCallback(async (filePath: string) => {
    try {
      const content = await invoke<string>('read_file', { path: filePath })
      const fileName = await invoke<string>('get_file_name', { path: filePath })
      const language = await invoke<string>('detect_language_from_path', { path: filePath })

      addTab({
        title: fileName,
        content,
        filePath,
        language,
        isDirty: false,
      })
    } catch (error) {
      console.error('Failed to open file:', error)
      addNotification({
        type: 'error',
        message: 'Failed to open file',
        details: String(error)
      })
    }
  }, [addTab, addNotification])

  const getFolderName = () => {
    if (!openFolderPath) return ''
    const parts = openFolderPath.split(/[\\/]/)
    return parts[parts.length - 1] || openFolderPath
  }

  if (!openFolderPath) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3>No Workspace Open</h3>
          <p>Open a workspace to browse files and directories</p>
          <button className={styles.openButton} onClick={handleOpenFolder}>
            Open Workspace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.folderHeader}>
        <span className={styles.folderPath} title={openFolderPath}>
          {getFolderName()}
        </span>
        <button className={styles.closeButton} onClick={handleCloseFolder} title="Close Folder">
          ×
        </button>
      </div>

      <div className={styles.tree}>
        <VirtualizedFileTree files={files} onFileClick={handleFileClick} />
      </div>
    </div>
  )
}
