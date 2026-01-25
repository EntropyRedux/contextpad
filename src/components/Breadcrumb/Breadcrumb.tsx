import { useState, useRef, useEffect } from 'react'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { invoke } from '@tauri-apps/api/core'
import { Folder, File, ChevronRight, ArrowLeft, MoreHorizontal, Save, Edit2 } from 'lucide-react'
import styles from './Breadcrumb.module.css'

interface FileNode {
  name: string
  path: string
  is_dir: boolean
}

export function Breadcrumb() {
  const { tabs, activeTabId, addTab, setActiveTab, updateTab, openFolderPath, viewSettings } = useTabStore()
  const addNotification = useNotificationStore(state => state.addNotification)
  
  const [openDropdown, setOpenDropdown] = useState<number | 'file' | null>(null)
  const [dropdownItems, setDropdownItems] = useState<FileNode[]>([])
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [currentDropdownPath, setCurrentDropdownPath] = useState<string>('')
  const [baseSegmentPath, setBaseSegmentPath] = useState<string>('')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [browsePath, setBrowsePath] = useState<string>('')

  const breadcrumbRef = useRef<HTMLDivElement>(null)
  const segmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const activeTab = tabs.find(t => t.id === activeTabId)

  // Sync browsePath with active file or workspace root when tab changes
  useEffect(() => {
    if (activeTab?.filePath) {
      setBrowsePath(activeTab.filePath)
    } else if (openFolderPath) {
      setBrowsePath(openFolderPath)
    }
  }, [activeTab?.filePath, activeTabId, openFolderPath])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (breadcrumbRef.current && !breadcrumbRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    if (openDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  if (!viewSettings.showBreadcrumb || !activeTab) return null

  // Determine root workspace folder
  let rootFolder = openFolderPath
  if (!rootFolder && activeTab.filePath) {
    const parts = activeTab.filePath.split(/[\\/]/)
    parts.pop()
    rootFolder = parts.join('\\')
  }
  if (!rootFolder) rootFolder = browsePath || ''

  // Build segments relative to root
  const relativePath = browsePath.replace(rootFolder, '').replace(/^[\\/]+/, '')
  const segments = relativePath ? relativePath.split(/[\\/]/).filter(Boolean) : []
  const rootFolderName = rootFolder.split(/[\\/]/).filter(Boolean).pop() || 'Workspace'

  // --- Handlers ---

  const handleSegmentClick = async (index: number, path: string) => {
    if (openDropdown === index) {
      setOpenDropdown(null)
      return
    }

    try {
      const items = await invoke<FileNode[]>('read_directory', { path })
      setDropdownItems(items)
      setCurrentDropdownPath(path)
      setBaseSegmentPath(path)
      
      const rect = segmentRefs.current[`seg-${index}`]?.getBoundingClientRect()
      if (rect) {
        setDropdownPosition({ top: rect.bottom + 2, left: rect.left })
      }
      setOpenDropdown(index)
    } catch (err) {
      console.error('Failed to read directory:', err)
    }
  }

  const handleNavigateDropdown = async (path: string) => {
    try {
      const items = await invoke<FileNode[]>('read_directory', { path })
      setDropdownItems(items)
      setCurrentDropdownPath(path)
    } catch (err) {
      console.error(err)
    }
  }

  const handleNavigateUp = () => {
    if (currentDropdownPath === baseSegmentPath) return
    const parts = currentDropdownPath.split(/[\\/]/)
    parts.pop()
    handleNavigateDropdown(parts.join('\\'))
  }

  const handleSelectFolder = (path: string) => {
    setBrowsePath(path)
    setOpenDropdown(null)
  }

  const handleSelectFile = async (path: string) => {
    try {
      const content = await invoke<string>('read_file', { path })
      const title = await invoke<string>('get_file_name', { path })
      const language = await invoke<string>('detect_language_from_path', { path })
      
      const existing = tabs.find(t => t.filePath === path)
      if (existing) {
        setActiveTab(existing.id)
      } else {
        addTab({ title, content, filePath: path, language, isDirty: false })
      }
      setOpenDropdown(null)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  const handleFileActionClick = () => {
    const rect = segmentRefs.current['file-seg']?.getBoundingClientRect()
    if (rect) {
      setDropdownPosition({ top: rect.bottom + 2, left: rect.left })
    }
    setOpenDropdown('file')
  }

  const handleRenameSubmit = async () => {
    if (!activeTab || !renameValue.trim() || !activeTab.filePath) return
    try {
      const dir = activeTab.filePath.split(/[\\/]/)
      dir.pop()
      const newPath = `${dir.join('\\')}\\${renameValue}`
      await invoke('rename_file', { oldPath: activeTab.filePath, newPath })
      updateTab(activeTab.id, { title: renameValue, filePath: newPath })
      addNotification({
        type: 'success',
        message: 'File renamed',
        details: `Renamed to: ${renameValue}`
      })
    } catch (err) {
      addNotification({
        type: 'error',
        message: 'Rename failed',
        details: String(err)
      })
    }
    setShowRenameDialog(false)
  }

  const handleSave = async () => {
    if (!activeTab?.filePath) return
    try {
      await invoke('write_file', { path: activeTab.filePath, content: activeTab.content })
      updateTab(activeTab.id, { isDirty: false })
    } catch (err) {
      console.error(err)
    }
    setOpenDropdown(null)
  }

  return (
    <>
      {showRenameDialog && (
        <div className={styles.renameDialog}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>Rename File</div>
            <input
              type="text"
              className={styles.renameInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setShowRenameDialog(false)
              }}
              autoFocus
            />
            <div className={styles.dialogButtons}>
              <button onClick={handleRenameSubmit} className={styles.primaryBtn}>Rename</button>
              <button onClick={() => setShowRenameDialog(false)} className={styles.secondaryBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div ref={breadcrumbRef} className={styles.breadcrumbBar}>
        {/* Root Workspace Segment */}
        <div 
          ref={el => segmentRefs.current['seg--1'] = el}
          className={`${styles.segment} ${openDropdown === -1 ? styles.segmentOpen : ''}`} 
          onClick={() => handleSegmentClick(-1, rootFolder)}
        >
          <Folder size={14} className={styles.icon} />
          <span className={styles.text}>{rootFolderName}</span>
          <ChevronRight size={14} className={styles.chevron} />
        </div>

        {/* Sub-path Segments */}
        {segments.map((name, i) => {
          const path = rootFolder + '\\' + segments.slice(0, i + 1).join('\\')
          const isLast = i === segments.length - 1
          const isActualFile = isLast && activeTab.filePath === browsePath

          if (isActualFile) {
            return (
              <div key={i} className={styles.segmentWrapper}>
                <span className={styles.separator}>/</span>
                <div 
                  ref={el => segmentRefs.current['file-seg'] = el} 
                  className={`${styles.segment} ${openDropdown === 'file' ? styles.segmentOpen : ''}`} 
                  onClick={handleFileActionClick}
                >
                  <File size={14} className={styles.icon} />
                  <span className={styles.text}>{name}</span>
                  {activeTab.isDirty && <span className={styles.modifiedIndicator}>●</span>}
                </div>
              </div>
            )
          }

          return (
            <div key={i} className={styles.segmentWrapper}>
              <span className={styles.separator}>/</span>
              <div 
                ref={el => segmentRefs.current[`seg-${i}`] = el}
                className={`${styles.segment} ${openDropdown === i ? styles.segmentOpen : ''}`} 
                onClick={() => handleSegmentClick(i, path)}
              >
                <span className={styles.text}>{name}</span>
                <ChevronRight size={14} className={styles.chevron} />
              </div>
            </div>
          )
        })}

        {/* Dynamic Folder Dropdown */}
        {typeof openDropdown === 'number' && (
          <div className={styles.dropdown} style={{ position: 'fixed', top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
            {currentDropdownPath !== baseSegmentPath && (
              <>
                <div className={styles.dropdownItem} onClick={handleNavigateUp}>
                  <ArrowLeft size={14} className={styles.itemIcon} />
                  <span className={styles.itemText}>Back</span>
                </div>
                <div className={styles.dropdownSeparator} />
              </>
            )}
            {dropdownItems.map((item) => (
              <div key={item.path} className={styles.dropdownItem} onClick={() => item.is_dir ? handleSelectFolder(item.path) : handleSelectFile(item.path)}>
                <span className={styles.itemIcon}>{item.is_dir ? <Folder size={14} /> : <File size={14} />}</span>
                <span className={styles.itemText}>{item.name}</span>
                {item.is_dir && <ChevronRight size={12} style={{marginLeft: 'auto', opacity: 0.5}} />}
              </div>
            ))}
            {dropdownItems.length === 0 && <div className={styles.emptyDropdown}>Empty directory</div>}
          </div>
        )}

        {/* File Actions Dropdown */}
        {openDropdown === 'file' && (
          <div className={styles.dropdown} style={{ position: 'fixed', top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
            <div className={styles.dropdownItem} onClick={() => { setRenameValue(activeTab?.title || ''); setShowRenameDialog(true); setOpenDropdown(null); }}>
              <Edit2 size={14} className={styles.itemIcon} />
              <span className={styles.itemText}>Rename</span>
            </div>
            <div className={styles.dropdownItem} onClick={handleSave}>
              <Save size={14} className={styles.itemIcon} />
              <span className={styles.itemText}>Save</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
