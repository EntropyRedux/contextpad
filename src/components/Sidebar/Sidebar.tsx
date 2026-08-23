import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useTabStore, PinnedTab } from '../../store/tabStore'
import { useShallow } from 'zustand/react/shallow'
import { Settings, FileText, Zap, Plus } from 'lucide-react'
import * as Icons from 'lucide-react'

// Lazy load sidebar panels (only loaded when sidebar is opened)
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const TemplateManager = lazy(() => import('./TemplateManager').then(m => ({ default: m.TemplateManager })))
const ActionManager = lazy(() => import('./ActionManager').then(m => ({ default: m.ActionManager })))
const WorkflowManager = lazy(() => import('./WorkflowManager').then(m => ({ default: m.WorkflowManager })))
import styles from './Sidebar.module.css'

type SidebarView = 'settings' | 'templates' | 'actions' | 'workflows' | null

// Dynamic icon component for pinned tabs
function DynamicIcon({ name, size = 20 }: { name: string; size?: number }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name]
  if (!IconComponent) return <FileText size={size} />
  return <IconComponent size={size} />
}

export function Sidebar() {
  const { showRightSidebar, toggleRightSidebar, sidebarView, setSidebarView, pinnedTabs, addTab, tabs, setActiveTab, showActivityBar } = useTabStore(
    useShallow(state => ({
      showRightSidebar: state.showRightSidebar,
      toggleRightSidebar: state.toggleRightSidebar,
      sidebarView: state.sidebarView,
      setSidebarView: state.setSidebarView,
      pinnedTabs: state.pinnedTabs,
      addTab: state.addTab,
      tabs: state.tabs,
      setActiveTab: state.setActiveTab,
      showActivityBar: state.viewSettings.showActivityBar
    }))
  )
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

  // Handle icon click - if sidebar is closed, open it; if clicking same view, close it
  const handleIconClick = (view: SidebarView) => {
    if (!showRightSidebar) {
      setSidebarView(view as 'settings' | 'templates' | 'actions' | 'workflows')
    } else if (activeView === view) {
      toggleRightSidebar()
    } else {
      setSidebarView(view as 'settings' | 'templates' | 'actions' | 'workflows')
    }
  }

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handlePinnedTabClick = (pin: PinnedTab) => {
    // Clear any pending click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      return
    }

    // Delay single-click to allow double-click detection
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null

      const existingTab = tabs.find(t => t.pinnedTabId === pin.id)
      if (existingTab) {
        setActiveTab(existingTab.id)
      } else {
        addTab({
          title: pin.name,
          content: pin.content,
          language: 'markdown',
          pinnedTabId: pin.id
        })
      }
    }, 200) // 200ms delay for double-click window
  }

  const handlePinnedTabDoubleClick = (pin: PinnedTab) => {
    // Clear single-click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }

    // Force open fresh copy
    addTab({
      title: pin.name,
      content: pin.content,
      language: 'markdown',
      pinnedTabId: pin.id
    })
  }

  if (!showActivityBar && !showRightSidebar) {
    return null
  }

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebarContainer} ${!showRightSidebar ? styles.collapsed : ''}`}
      style={{ width: showRightSidebar ? `${sidebarWidth}px` : undefined }}
    >
      {/* Resize Handle */}
      {showRightSidebar && (
        <div
          className={styles.resizeHandle}
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      {/* Content Panel */}
      {showRightSidebar && (
        <div className={styles.contentPanel}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {activeView === 'settings' && 'Settings'}
              {activeView === 'templates' && 'Template Manager'}
              {activeView === 'actions' && 'Action Manager'}
              {activeView === 'workflows' && 'Workflow Manager'}
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
            <Suspense fallback={null}>
              {activeView === 'settings' && <SettingsPanel />}
              {activeView === 'templates' && <TemplateManager />}
              {activeView === 'actions' && <ActionManager />}
              {activeView === 'workflows' && <WorkflowManager />}
            </Suspense>
          </div>
        </div>
      )}

      {/* Icon Bar */}
      {showActivityBar && (
        <div className={styles.iconBar}>
          <button
            className={`${styles.iconButton} ${showRightSidebar && activeView === 'settings' ? styles.active : ''}`}
            onClick={() => handleIconClick('settings')}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            className={`${styles.iconButton} ${showRightSidebar && activeView === 'templates' ? styles.active : ''}`}
            onClick={() => handleIconClick('templates')}
            title="Template Manager"
          >
            <FileText size={20} />
          </button>
          <button
            className={`${styles.iconButton} ${showRightSidebar && activeView === 'actions' ? styles.active : ''}`}
            onClick={() => handleIconClick('actions')}
            title="Action Manager"
          >
            <Zap size={20} />
          </button>

          {/* Manage Workflows (+) icon - now positioned above pinned tabs */}
          <button
            className={`${styles.iconButton} ${styles.addButton} ${showRightSidebar && activeView === 'workflows' ? styles.active : ''}`}
            onClick={() => handleIconClick('workflows')}
            title="Manage Workflows"
          >
            <Plus size={20} />
          </button>

          {/* Separator */}
          {pinnedTabs.length > 0 && <div className={styles.iconSeparator} />}

          {/* Pinned tabs (User Workflows) icons rendered below the + button */}
          {pinnedTabs.map(pin => (
            <button
              key={pin.id}
              className={styles.iconButton}
              onClick={() => handlePinnedTabClick(pin)}
              onDoubleClick={() => handlePinnedTabDoubleClick(pin)}
              title={`${pin.name} (double-click for fresh copy)`}
            >
              <DynamicIcon name={pin.icon} size={20} />
            </button>
          ))}

          <div className={styles.iconSpacer} />
        </div>
      )}
    </div>
  )
}