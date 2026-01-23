import { useState, useRef, useEffect } from 'react'
import { useTabStore } from '../../store/tabStore'
import { Settings, FileText, Zap } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { TemplateManager } from './TemplateManager'
import { ActionManager } from './ActionManager'
import styles from './Sidebar.module.css'

type SidebarView = 'settings' | 'templates' | 'actions' | null

export function Sidebar() {
  const { showRightSidebar, toggleRightSidebar, sidebarView, setSidebarView } = useTabStore()
  const activeView = sidebarView
  const [sidebarWidth, setSidebarWidth] = useState(350)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return

      const containerRect = sidebarRef.current.getBoundingClientRect()
      const newWidth = containerRect.right - e.clientX

      // Constrain between 250px and 600px
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  if (!showRightSidebar) return null

  return (
    <div
      ref={sidebarRef}
      className={styles.sidebarContainer}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className={styles.resizeHandle}
        onMouseDown={() => setIsResizing(true)}
      />

      {/* Content Panel */}
      <div className={styles.contentPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {activeView === 'settings' && 'Settings'}
            {activeView === 'templates' && 'Template Manager'}
            {activeView === 'actions' && 'Action Manager'}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={toggleRightSidebar}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          {activeView === 'settings' && <SettingsPanel />}
          {activeView === 'templates' && <TemplateManager />}
          {activeView === 'actions' && <ActionManager />}
        </div>
      </div>

      {/* Icon Bar (right side of sidebar) */}
      <div className={styles.iconBar}>
        <button
          className={`${styles.iconButton} ${activeView === 'settings' ? styles.active : ''}`}
          onClick={() => setSidebarView('settings')}
          title="Settings"
        >
          <Settings size={24} />
        </button>
        <button
          className={`${styles.iconButton} ${activeView === 'templates' ? styles.active : ''}`}
          onClick={() => setSidebarView('templates')}
          title="Template Manager"
        >
          <FileText size={24} />
        </button>
        <button
          className={`${styles.iconButton} ${activeView === 'actions' ? styles.active : ''}`}
          onClick={() => setSidebarView('actions')}
          title="Action Manager"
        >
          <Zap size={24} />
        </button>
      </div>
    </div>
  )
}
